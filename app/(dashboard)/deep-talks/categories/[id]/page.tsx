"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconPicker from "@/components/ui/IconPicker";
import LanguageSelector from "@/components/forms/LanguageSelector";
import DeepTalkCategoryTranslationFields from "@/components/forms/DeepTalkCategoryTranslationFields";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SuccessModal from "@/components/ui/SuccessModal";

interface DeepTalkCategoryTranslation {
  language_code: string;
  name: string;
}

interface FormData {
  game_mode_id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
  sort_order: number;
  is_premium: boolean;
  is_active: boolean;
}

export default function EditDeepTalkCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Traducciones
  const [translations, setTranslations] = useState<
    Record<string, DeepTalkCategoryTranslation>
  >({});

  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    game_mode_id: "33333333-3333-3333-3333-333333333333", // Deep Talks
    label: "",
    icon: "chatbubbles",
    color: "#8B5CF6",
    route: "",
    sort_order: 0,
    is_premium: false,
    is_active: true,
  });

  useEffect(() => {
    fetchCategoryData();
  }, [categoryId]);

  const fetchCategoryData = async () => {
    try {
      setIsFetching(true);

      // Cargar categoría
      const { data: category, error: categoryError } = await supabase
        .from("deep_talk_categories")
        .select(
          `
          id,
          game_mode_id,
          label,
          icon,
          color,
          route,
          sort_order,
          is_premium,
          is_active,
          deep_talk_categories_translations (
            language_code,
            name
          )
        `
        )
        .eq("id", categoryId)
        .single();

      if (categoryError || !category) {
        // Redirigir a la página not-found que automáticamente llevará a /deep-talks/categories
        notFound();
      }

      // Actualizar formData
      const categoryData = category as any;
      const sortOrder = categoryData.sort_order || 0;
      setFormData({
        game_mode_id:
          categoryData.game_mode_id || "33333333-3333-3333-3333-333333333333",
        label: categoryData.label || "",
        icon: categoryData.icon || "chatbubbles",
        color: categoryData.color || "#8B5CF6",
        route: categoryData.route || "",
        sort_order: sortOrder,
        is_premium: categoryData.is_premium || false,
        is_active: categoryData.is_active || false,
      });

      // Actualizar traducciones
      const translationsData: Record<string, DeepTalkCategoryTranslation> = {};
      const languages: string[] = [];

      categoryData.deep_talk_categories_translations.forEach((translation: any) => {
        translationsData[translation.language_code] = {
          language_code: translation.language_code,
          name: translation.name,
        };
        languages.push(translation.language_code);
      });

      setTranslations(translationsData);
      setSelectedLanguages(languages);
    } catch (error) {
      console.error("Error al cargar la categoría:", error);
      // Si hay un error al cargar, redirigir a not-found
      notFound();
    } finally {
      setIsFetching(false);
    }
  };

  const handleTranslationChange = (languageCode: string, name: string) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        language_code: languageCode,
        name,
      },
    }));
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    try {
      // Obtener la traducción en español
      const esTranslation = translations["es"];

      if (
        !esTranslation ||
        !esTranslation.name ||
        esTranslation.name.trim() === ""
      ) {
        alert(
          "Por favor, completa primero el nombre en español antes de auto-traducir"
        );
        return;
      }

      // Llamar a la API de traducción
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: esTranslation.name,
          targetLanguages: [targetLanguage],
        }),
      });

      const result = await response.json();

      if (result.success && result.translations[targetLanguage]) {
        // Actualizar la traducción
        setTranslations((prev) => ({
          ...prev,
          [targetLanguage]: {
            language_code: targetLanguage,
            name: result.translations[targetLanguage],
          },
        }));
      } else {
        alert("Error al traducir. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error al auto-traducir:", error);
      alert("Error al traducir. Intenta de nuevo.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todas las traducciones tengan nombre
    const missingNames = selectedLanguages.filter(
      (lang) =>
        !translations[lang]?.name || translations[lang].name.trim() === ""
    );

    if (missingNames.length > 0) {
      alert(
        "Por favor, completa el nombre para todos los idiomas seleccionados"
      );
      return;
    }

    // Abrir modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);

    try {
      const categoryData = {
        game_mode_id: formData.game_mode_id,
        label: formData.label,
        icon: formData.icon,
        color: formData.color,
        route: formData.route,
        sort_order: formData.sort_order,
        is_premium: formData.is_premium,
        is_active: formData.is_active,
      };

      const translationsToInsert = selectedLanguages.map((lang) => ({
        language_code: lang,
        name: translations[lang].name,
      }));

      const { updateDeepTalkCategory } = await import('@/actions/deepTalks');
      const result = await updateDeepTalkCategory(categoryId, categoryData, translationsToInsert);

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
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#7B46F8]/30 border-t-[#7B46F8] rounded-full animate-spin" />
          <p className="text-[#999999] font-medium">Cargando filtro...</p>
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
                  href="/deep-talks/categories"
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
                <div className="flex items-center gap-3">
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Editar Filtro
                    </h1>
                    <p className="text-xs text-[#999999] font-medium">
                      Modificar filtro de Deep Talks
                    </p>
                  </div>
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Información General
                  </h2>
                  <p className="text-sm text-[#CCCCCC]">
                    Configuración básica del filtro
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Label Interno"
                  placeholder="categoria-reflexiones"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  helperText="Identificador único interno (minúsculas, guiones)"
                  required
                />

                <IconPicker
                  label="Icono"
                  placeholder="Buscar ícono..."
                  value={formData.icon}
                  onChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                  helperText="Busca o selecciona un ícono de Ionicons"
                  required
                />

                <Input
                  label="Color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  helperText="Color principal de la categoría"
                  required
                />

                <Input
                  label="Ruta"
                  placeholder="/deep-talks/reflexiones"
                  value={formData.route}
                  onChange={(e) =>
                    setFormData({ ...formData, route: e.target.value })
                  }
                  helperText="Ruta de navegación en la app (opcional)"
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
                  required
                />
              </div>

              {/* Vista previa del color */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Vista Previa del Color
                </label>
                <div
                  className="h-24 rounded-xl border-2 border-[#333333]"
                  style={{
                    backgroundColor: formData.color,
                  }}
                />
              </div>

              {/* Checkboxes */}
              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) =>
                      setFormData({ ...formData, is_premium: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#333333] text-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/50 bg-[#1A1A1A]"
                  />
                  <span className="text-sm text-white font-medium">
                    Es contenido Premium
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#333333] text-[#7B46F8] focus:ring-2 focus:ring-[#7B46F8]/50 bg-[#1A1A1A]"
                  />
                  <span className="text-sm text-white font-medium">
                    Filtro Activo
                  </span>
                </label>
              </div>
            </div>

            {/* Idiomas */}
            <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
              <LanguageSelector
                selectedLanguages={selectedLanguages}
                onChange={(languages) => {
                  setSelectedLanguages(languages);
                  // Agregar traducciones vacías para nuevos idiomas
                  const newTranslations = { ...translations };
                  languages.forEach((lang) => {
                    if (!newTranslations[lang]) {
                      newTranslations[lang] = {
                        language_code: lang,
                        name: "",
                      };
                    }
                  });
                  setTranslations(newTranslations);
                }}
              />
            </div>

            {/* Traducciones */}
            <div>
              <DeepTalkCategoryTranslationFields
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
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar cambios"
        message="¿Estás seguro de que deseas guardar los cambios en este filtro? Esta acción actualizará todas las traducciones y configuraciones."
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
          router.push("/deep-talks/categories");
        }}
        title="¡Filtro actualizado!"
        message="Los cambios en el filtro se han guardado exitosamente. Todas las traducciones y configuraciones han sido actualizadas."
      />
    </div>
  );
}
