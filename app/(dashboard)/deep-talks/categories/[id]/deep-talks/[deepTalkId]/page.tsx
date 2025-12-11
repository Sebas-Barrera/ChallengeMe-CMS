"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconPicker from "@/components/ui/IconPicker";
import LanguageSelector from "@/components/forms/LanguageSelector";
import DeepTalkTranslationFields from "@/components/forms/DeepTalkTranslationFields";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SuccessModal from "@/components/ui/SuccessModal";
import Toast from "@/components/ui/Toast";

interface DeepTalkTranslation {
  language_code: string;
  title: string;
  subtitle: string;
  description: string;
  intensity: string;
}

interface FormData {
  icon: string;
  gradient_colors: [string, string];
  estimated_time: string;
  is_active: boolean;
  sort_order: number;
}

interface PageProps {
  params: Promise<{ id: string; deepTalkId: string }>;
}

export default function EditDeepTalkPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const deepTalkId = resolvedParams.deepTalkId;
  const router = useRouter();
  const { supabase } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Traducciones
  const [translations, setTranslations] = useState<
    Record<string, DeepTalkTranslation>
  >({});

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

  useEffect(() => {
    fetchDeepTalkData();
  }, [deepTalkId]);

  const fetchDeepTalkData = async () => {
    try {
      setIsFetching(true);

      // Cargar Deep Talk con traducciones
      const { data: deepTalk, error: deepTalkError } = await supabase
        .from("deep_talks")
        .select(
          `
          id,
          deep_talk_category_id,
          icon,
          gradient_colors,
          estimated_time,
          is_active,
          sort_order,
          deep_talk_translations (
            language_code,
            title,
            subtitle,
            description,
            intensity
          )
        `
        )
        .eq("id", deepTalkId)
        .single();

      if (deepTalkError || !deepTalk) {
        // Redirigir a la página not-found que automáticamente llevará a /deep-talks/categories
        notFound();
      }

      // Actualizar formData
      setFormData({
        icon: (deepTalk as any).icon || "chatbubbles",
        gradient_colors: (deepTalk as any).gradient_colors || ["#8B5CF6", "#EC4899"],
        estimated_time: (deepTalk as any).estimated_time || "15-20 min",
        is_active: (deepTalk as any).is_active || false,
        sort_order: (deepTalk as any).sort_order || 0,
      });

      // Actualizar traducciones
      const translationsData: Record<string, DeepTalkTranslation> = {};
      const languages: string[] = [];

      deepTalk.deep_talk_translations.forEach((translation: any) => {
        translationsData[translation.language_code] = {
          language_code: translation.language_code,
          title: translation.title || "",
          subtitle: translation.subtitle || "",
          description: translation.description || "",
          intensity: translation.intensity || "",
        };
        if (!languages.includes(translation.language_code)) {
          languages.push(translation.language_code);
        }
      });

      setTranslations(translationsData);
      setSelectedLanguages(languages);
    } catch (error) {
      console.error("Error al cargar deep talk:", error);
      // Si hay un error al cargar, redirigir a not-found
      notFound();
    } finally {
      setIsFetching(false);
    }
  };

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

      const textsToTranslate = [
        esTranslation.title,
        esTranslation.subtitle,
        esTranslation.description,
        esTranslation.intensity,
      ].filter(Boolean);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textsToTranslate.join("\n---\n"),
          targetLanguages: [targetLanguage],
        }),
      });

      const result = await response.json();

      if (result.success && result.translations[targetLanguage]) {
        const translatedTexts =
          result.translations[targetLanguage].split("\n---\n");

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
      } else {
        setToast({
          message: "Error al traducir. Intenta de nuevo.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al auto-traducir:", error);
      setToast({
        message: "Error al traducir. Intenta de nuevo.",
        type: "error",
      });
    }
  };

  const handleLanguageChange = (languages: string[]) => {
    setSelectedLanguages(languages);

    const newTranslations = { ...translations };

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
    });

    setTranslations(newTranslations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar traducciones
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
      return;
    }

    // Abrir modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);

    try {
      const deepTalkData = {
        icon: formData.icon || null,
        gradient_colors: formData.gradient_colors,
        estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      const translationsToInsert = selectedLanguages.map((lang) => ({
        language_code: lang,
        title: translations[lang].title,
        subtitle: translations[lang].subtitle || null,
        description: translations[lang].description || null,
        intensity: translations[lang].intensity || null,
      }));

      const { updateDeepTalk } = await import('@/actions/deepTalks');
      const result = await updateDeepTalk(deepTalkId, deepTalkData, translationsToInsert);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Éxito - mostrar modal de éxito
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar la categoría. Por favor, intenta de nuevo.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
          <p className="text-[#999999]">Cargando categoría...</p>
        </div>
      </div>
    );
  }

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
                  Editar Categoría
                </h1>
                <p className="text-xs text-[#999999] font-medium">
                  Modificar categoría de Deep Talks
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
                  Configuración básica de la categoría
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                label="Icono"
                placeholder="Buscar ícono..."
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                helperText="Busca o selecciona un ícono de Ionicons"
                required
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Color Inicial del Gradiente
                </label>
                <input
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
                  className="w-full h-12 rounded-lg border-2 border-[#333333] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Color Final del Gradiente
                </label>
                <input
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
                  className="w-full h-12 rounded-lg border-2 border-[#333333] cursor-pointer"
                />
              </div>

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
                required
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

            {/* Checkbox activa */}
            <div className="mt-6">
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
                  Categoría Activa
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
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </main>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar cambios"
        message="¿Estás seguro de que deseas guardar los cambios en esta categoría? Esta acción actualizará todas las traducciones y preguntas."
        confirmText="Guardar cambios"
        cancelText="Cancelar"
        variant="warning"
        isLoading={isLoading}
      />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push(`/deep-talks/categories/${categoryId}/deep-talks`);
        }}
        title="¡Categoría actualizada!"
        message="Los cambios en la categoría se han guardado exitosamente. Todas las traducciones y preguntas han sido actualizadas."
      />

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
