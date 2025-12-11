"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconPicker from "@/components/ui/IconPicker";
import LanguageSelector from "@/components/forms/LanguageSelector";
import DeepTalkTranslationFields from "@/components/forms/DeepTalkTranslationFields";
import DeepTalkQuestionsManager from "@/components/forms/DeepTalkQuestionsManager";
import Toast from "@/components/ui/Toast";
import Image from "next/image";

interface DeepTalkTranslation {
  language_code: string;
  title: string;
  subtitle: string;
  description: string;
  intensity: string;
}

interface DeepTalkQuestion {
  question: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  temp_id?: string;
}

interface FormData {
  icon: string;
  gradient_colors: [string, string];
  estimated_time: string;
  is_active: boolean;
  sort_order: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewDeepTalkPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const router = useRouter();
  const { supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryPremium, setIsCategoryPremium] = useState<boolean>(false);

  useEffect(() => {
    const loadCategory = async () => {
      const { data, error } = await supabase
        .from("deep_talk_categories")
        .select("is_premium")
        .eq("id", categoryId)
        .single();

      if (!error && data) {
        setIsCategoryPremium(data.is_premium);
      }
    };

    loadCategory();
  }, [categoryId, supabase]);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "es",
    "en",
  ]);

  // Traducciones
  const [translations, setTranslations] = useState<
    Record<string, DeepTalkTranslation>
  >({
    es: {
      language_code: "es",
      title: "",
      subtitle: "",
      description: "",
      intensity: "",
    },
    en: {
      language_code: "en",
      title: "",
      subtitle: "",
      description: "",
      intensity: "",
    },
  });

  // Preguntas
  const [questions, setQuestions] = useState<
    Record<string, DeepTalkQuestion[]>
  >({
    es: [],
    en: [],
  });

  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    icon: "chatbubbles",
    gradient_colors: ["#8B5CF6", "#EC4899"],
    estimated_time: "15-20 min",
    is_active: true,
    sort_order: 0,
  });

  // Estado para Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const handleTranslationChange = (
    languageCode: string,
    field: keyof DeepTalkTranslation,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value,
        language_code: languageCode,
      },
    }));
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    try {
      const esTranslation = translations["es"];

      if (
        !esTranslation ||
        !esTranslation.title ||
        esTranslation.title.trim() === ""
      ) {
        setToast({
          message:
            "Por favor, completa primero el título en español antes de auto-traducir",
          type: "warning",
        });
        return;
      }

      // Preparar los textos a traducir
      const textsToTranslate: string[] = [esTranslation.title];
      if (esTranslation.subtitle) textsToTranslate.push(esTranslation.subtitle);
      if (esTranslation.description)
        textsToTranslate.push(esTranslation.description);
      if (esTranslation.intensity)
        textsToTranslate.push(esTranslation.intensity);

      // Llamar a la API de traducción para cada texto
      const translatedTexts: string[] = [];
      for (const text of textsToTranslate) {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            targetLanguages: [targetLanguage],
          }),
        });

        const result = await response.json();
        if (result.success && result.translations[targetLanguage]) {
          translatedTexts.push(result.translations[targetLanguage]);
        } else {
          translatedTexts.push("");
        }
      }

      // Actualizar la traducción
      setTranslations((prev) => ({
        ...prev,
        [targetLanguage]: {
          language_code: targetLanguage,
          title: translatedTexts[0] || "",
          subtitle: translatedTexts[1] || "",
          description: translatedTexts[2] || "",
          intensity: translatedTexts[3] || "",
        },
      }));
    } catch (error) {
      console.error("Error al auto-traducir:", error);
      setToast({
        message: "Error al traducir. Intenta de nuevo.",
        type: "error",
      });
    }
  };

  const handleQuestionsChange = (
    languageCode: string,
    newQuestions: DeepTalkQuestion[]
  ) => {
    setQuestions((prev) => ({
      ...prev,
      [languageCode]: newQuestions,
    }));
  };

  const handleAutoTranslateQuestion = async (
    sourceLanguage: string,
    questionIndex: number
  ) => {
    try {
      const sourceQuestion = questions[sourceLanguage]?.[questionIndex];

      if (!sourceQuestion || !sourceQuestion.question.trim()) {
        setToast({ message: "No hay pregunta para traducir", type: "warning" });
        return;
      }

      // Traducir a cada idioma seleccionado (excepto el idioma fuente)
      const targetLanguages = selectedLanguages.filter(
        (lang) => lang !== sourceLanguage
      );

      for (const targetLang of targetLanguages) {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sourceQuestion.question,
            targetLanguages: [targetLang],
          }),
        });

        const result = await response.json();

        if (result.success && result.translations[targetLang]) {
          // Actualizar o crear la pregunta en el idioma destino
          setQuestions((prev) => {
            const targetQuestions = prev[targetLang] || [];
            const updated = [...targetQuestions];

            // Si ya existe una pregunta en ese índice, actualizarla
            if (updated[questionIndex]) {
              updated[questionIndex] = {
                ...updated[questionIndex],
                question: result.translations[targetLang],
                icon: sourceQuestion.icon, // Copiar el emoji
              };
            } else {
              // Si no existe, crear una nueva pregunta
              updated[questionIndex] = {
                question: result.translations[targetLang],
                icon: sourceQuestion.icon,
                sort_order: questionIndex,
                is_active: sourceQuestion.is_active,
                temp_id: `temp_${Date.now()}_${Math.random()}`,
              };
            }

            return {
              ...prev,
              [targetLang]: updated,
            };
          });
        }
      }

      setToast({
        message: "Pregunta traducida exitosamente a todos los idiomas",
        type: "success",
      });
    } catch (error) {
      console.error("Error al auto-traducir pregunta:", error);
      setToast({
        message: "Error al traducir la pregunta. Intenta de nuevo.",
        type: "error",
      });
    }
  };

  const handleLanguageChange = (languages: string[]) => {
    setSelectedLanguages(languages);

    // Agregar traducciones vacías para nuevos idiomas
    const newTranslations = { ...translations };
    const newQuestions = { ...questions };

    languages.forEach((lang) => {
      if (!newTranslations[lang]) {
        newTranslations[lang] = {
          language_code: lang,
          title: "",
          subtitle: "",
          description: "",
          intensity: "",
        };
      }
      if (!newQuestions[lang]) {
        newQuestions[lang] = [];
      }
    });

    setTranslations(newTranslations);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar que todas las traducciones tengan título
      const missingTitles = selectedLanguages.filter(
        (lang) =>
          !translations[lang]?.title || translations[lang].title.trim() === ""
      );

      if (missingTitles.length > 0) {
        setToast({
          message:
            "Por favor, completa el título para todos los idiomas seleccionados",
          type: "warning",
        });
        setIsLoading(false);
        return;
      }

      // Validación de preguntas es opcional - comentada
      // const missingQuestions = selectedLanguages.filter(
      //   (lang) => !questions[lang] || questions[lang].length === 0
      // );

      // if (missingQuestions.length > 0) {
      //   setToast({ message: 'Por favor, agrega al menos una pregunta para todos los idiomas seleccionados', type: 'warning' });
      //   setIsLoading(false);
      //   return;
      // }

      // 1. Recorrer los sort_order existentes dentro de este filtro
      const { data: existingDeepTalks } = await supabase
        .from('deep_talks')
        .select('id, sort_order')
        .eq('deep_talk_category_id', categoryId)
        .gte('sort_order', formData.sort_order)
        .order('sort_order', { ascending: false });

      // Actualizar cada uno incrementando su sort_order en 1
      if (existingDeepTalks && existingDeepTalks.length > 0) {
        for (const existing of existingDeepTalks) {
          const newSortOrder = (existing as { id: string; sort_order: number }).sort_order + 1;
          const existingId = (existing as { id: string; sort_order: number }).id;

          await supabase
            .from('deep_talks')
            .update({ sort_order: newSortOrder } as any)
            .eq('id', existingId);
        }
      }

      // 2. Insertar deep_talk
      const { data: deepTalk, error: deepTalkError } = await supabase
        .from("deep_talks")
        .insert({
          deep_talk_category_id: categoryId,
          icon: formData.icon || null,
          gradient_colors: formData.gradient_colors,
          estimated_time: formData.estimated_time || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .select("id")
        .single();

      if (deepTalkError) {
        throw new Error(deepTalkError.message);
      }

      // Actualizar categoría (is_premium)
      await supabase
        .from("deep_talk_categories")
        .update({ is_premium: isCategoryPremium })
        .eq("id", categoryId);

      // 3. Insertar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => ({
        deep_talk_id: deepTalk.id,
        language_code: lang,
        title: translations[lang].title,
        subtitle: translations[lang].subtitle || null,
        description: translations[lang].description || null,
        intensity: translations[lang].intensity || null,
      }));

      const { error: translationsError } = await supabase
        .from("deep_talk_translations")
        .insert(translationsToInsert);

      if (translationsError) {
        // Si falla, eliminar el deep talk
        await supabase.from("deep_talks").delete().eq("id", deepTalk.id);
        throw new Error(translationsError.message);
      }

      // 4. Insertar preguntas (solo si hay preguntas)
      const questionsToInsert = selectedLanguages.flatMap((lang) =>
        (questions[lang] || []).map((q) => ({
          deep_talk_id: deepTalk.id,
          language_code: lang,
          question: q.question,
          sort_order: q.sort_order,
          is_active: q.is_active,
          icon: q.icon || null,
        }))
      );

      // Solo insertar si hay preguntas
      if (questionsToInsert.length > 0) {
        const { error: questionsError } = await supabase
          .from("deep_talk_questions")
          .insert(questionsToInsert);

        if (questionsError) {
          // Si falla, eliminar todo
          await supabase.from("deep_talks").delete().eq("id", deepTalk.id);
          throw new Error(questionsError.message);
        }
      }

      // Éxito - redirigir
      setToast({
        message: `¡Plática creada exitosamente! ID: ${deepTalk.id}`,
        type: "success",
      });
      setTimeout(() => {
        router.push(`/deep-talks/categories/${categoryId}/deep-talks`);
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al crear la plática. Por favor, intenta de nuevo.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/top-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/bottom-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="relative z-10">
      {/* Header */}
      <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex-shrink-0">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <Image
                    src="/logos/ChallengeMe-05.png"
                    alt="ChallengeMe"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
              </Link>
              <Link
                href={`/deep-talks/categories/${categoryId}/deep-talks`}
                className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div className="h-10 w-px bg-[#333333]"></div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Nueva Plática Profunda
                </h1>
                <p className="text-xs text-[#999999] font-medium">
                  Agregar plática a la categoría
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información General */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#BDF522]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Información General
                </h2>
                <p className="text-sm text-[#999999]">
                  Configuración básica de la plática
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                label="Ícono"
                placeholder="Buscar ícono..."
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                helperText="Busca o selecciona un ícono de Ionicons (opcional)"
              />

              <Input
                label="Tiempo Estimado"
                placeholder="15-20 min"
                value={formData.estimated_time}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_time: e.target.value })
                }
                helperText="Duración aproximada de la plática"
              />

              <Input
                label="Color de Gradiente 1"
                type="color"
                value={formData.gradient_colors[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradient_colors: [
                      e.target.value,
                      formData.gradient_colors[1],
                    ],
                  })
                }
              />

              <Input
                label="Color de Gradiente 2"
                type="color"
                value={formData.gradient_colors[1]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradient_colors: [
                      formData.gradient_colors[0],
                      e.target.value,
                    ],
                  })
                }
              />

              <Input
                label="Orden de Visualización"
                type="number"
                min={0}
                value={formData.sort_order.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                helperText="Orden en que aparece (0 = primero)"
              />
            </div>

            {/* Vista previa del gradiente */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Vista Previa del Gradiente
              </label>
              <div
                className="h-24 rounded-xl border border-[#333333]"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradient_colors[0]}, ${formData.gradient_colors[1]})`,
                }}
              />
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">
                  Plática Activa
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCategoryPremium}
                  onChange={(e) => setIsCategoryPremium(e.target.checked)}
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">
                  Categoría Premium
                </span>
              </label>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={handleLanguageChange}
            />
          </div>

          {/* Traducciones */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B46F8]/20 to-[#7B46F8]/5 border border-[#7B46F8]/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#7B46F8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Traducciones
                </h2>
                <p className="text-sm text-[#999999]">
                  Información de la plática en cada idioma
                </p>
              </div>
            </div>
            <DeepTalkTranslationFields
              selectedLanguages={selectedLanguages}
              translations={translations}
              onChange={handleTranslationChange}
              onAutoTranslate={handleAutoTranslate}
            />
          </div>


          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#333333]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isLoading ? "Guardando..." : "Crear Plática"}
            </Button>
          </div>
        </form>
      </main>

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
}
