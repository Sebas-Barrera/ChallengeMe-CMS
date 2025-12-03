'use client';

import { useState } from 'react';
import { getLanguageByCode } from '@/constants/languages';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import EmojiPicker from '@/components/ui/EmojiPicker';

interface DeepTalkQuestion {
  question: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  temp_id?: string; // ID temporal para gestión local
}

interface DeepTalkQuestionsManagerProps {
  selectedLanguages: string[];
  questions: Record<string, DeepTalkQuestion[]>;
  onChange: (languageCode: string, questions: DeepTalkQuestion[]) => void;
  errors?: Record<string, string[]>;
  onAutoTranslateQuestion?: (sourceLanguage: string, questionIndex: number) => Promise<void>;
}

export default function DeepTalkQuestionsManager({
  selectedLanguages,
  questions,
  onChange,
  errors = {},
  onAutoTranslateQuestion,
}: DeepTalkQuestionsManagerProps) {
  const addQuestion = (languageCode: string) => {
    const currentQuestions = questions[languageCode] || [];
    const newQuestion: DeepTalkQuestion = {
      question: '',
      icon: null,
      sort_order: currentQuestions.length,
      is_active: true,
      temp_id: `temp_${Date.now()}_${Math.random()}`,
    };
    onChange(languageCode, [...currentQuestions, newQuestion]);
  };

  const removeQuestion = (languageCode: string, index: number) => {
    const currentQuestions = questions[languageCode] || [];
    const updated = currentQuestions.filter((_, i) => i !== index);
    // Reordenar sort_order
    const reordered = updated.map((q, i) => ({ ...q, sort_order: i }));
    onChange(languageCode, reordered);
  };

  const updateQuestion = (
    languageCode: string,
    index: number,
    field: keyof DeepTalkQuestion,
    value: any
  ) => {
    const currentQuestions = questions[languageCode] || [];
    const updated = [...currentQuestions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(languageCode, updated);
  };

  // Sincronizar emoji a todos los idiomas
  const syncEmojiToAllLanguages = (emoji: string, index: number) => {
    selectedLanguages.forEach((lang) => {
      const currentQuestions = questions[lang] || [];
      if (currentQuestions[index]) {
        const updated = [...currentQuestions];
        updated[index] = { ...updated[index], icon: emoji || null };
        onChange(lang, updated);
      }
    });
  };

  const moveQuestion = (languageCode: string, index: number, direction: 'up' | 'down') => {
    const currentQuestions = questions[languageCode] || [];
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === currentQuestions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...currentQuestions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Actualizar sort_order
    const reordered = updated.map((q, i) => ({ ...q, sort_order: i }));
    onChange(languageCode, reordered);
  };

  if (selectedLanguages.length === 0) {
    return (
      <div className="bg-bg-secondary/50 border border-border rounded-xl p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-text-secondary">
          Selecciona al menos un idioma para agregar preguntas
        </p>
      </div>
    );
  }

  // Ordenar idiomas: español primero, luego el resto alfabéticamente
  const sortedLanguages = [...selectedLanguages].sort((a, b) => {
    if (a === 'es') return -1;
    if (b === 'es') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {sortedLanguages.map((languageCode) => {
        const language = getLanguageByCode(languageCode);
        if (!language) return null;

        const languageQuestions = questions[languageCode] || [];
        const languageErrors = errors[languageCode] || [];

        return (
          <div
            key={languageCode}
            className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10"
          >
            {/* Header del idioma */}
            <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center">
                    <span className="text-2xl">{language.flag}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Preguntas en {language.nativeName}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {languageQuestions.length} pregunta{languageQuestions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addQuestion(languageCode)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Agregar Pregunta
                </Button>
              </div>
            </div>

            {/* Lista de preguntas */}
            {languageQuestions.length > 0 ? (
              <div className="space-y-4">
                {languageQuestions.map((q, index) => (
                  <div
                    key={q.temp_id || index}
                    className={`bg-bg-tertiary/50 border border-border/50 rounded-xl p-4 transition-all duration-200 ${
                      !q.is_active ? 'opacity-50 blur-[0.5px] grayscale' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Número de pregunta */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-blue">
                          {index + 1}
                        </span>
                      </div>

                      {/* Selector de Emoji */}
                      <div className="flex-shrink-0 w-40">
                        <EmojiPicker
                          label="Emoji"
                          value={q.icon || ''}
                          onChange={(emoji) => syncEmojiToAllLanguages(emoji, index)}
                          helperText=""
                        />
                      </div>

                      {/* Campo de pregunta */}
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Escribe la pregunta aquí..."
                              value={q.question}
                              onChange={(e) =>
                                updateQuestion(languageCode, index, 'question', e.target.value)
                              }
                              error={languageErrors[index]}
                              rows={2}
                              required
                            />
                          </div>

                          {/* Botón de auto-traducir solo para español */}
                          {languageCode === 'es' && onAutoTranslateQuestion && selectedLanguages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onAutoTranslateQuestion('es', index)}
                              disabled={!q.question.trim()}
                              className="mt-6 px-3 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              title="Auto-traducir a otros idiomas"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                />
                              </svg>
                              Traducir
                            </button>
                          )}
                        </div>

                        {/* Checkbox activa */}
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.is_active}
                            onChange={(e) =>
                              updateQuestion(languageCode, index, 'is_active', e.target.checked)
                            }
                            className="w-4 h-4 rounded border-border text-brand-yellow focus:ring-2 focus:ring-brand-yellow/50 bg-bg-tertiary"
                          />
                          <span className="text-xs text-text-secondary">
                            Pregunta activa
                          </span>
                        </label>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex-shrink-0 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(languageCode, index, 'up')}
                          disabled={index === 0}
                          className="w-8 h-8 rounded-lg bg-bg-tertiary hover:bg-border border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          title="Mover arriba"
                        >
                          <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(languageCode, index, 'down')}
                          disabled={index === languageQuestions.length - 1}
                          className="w-8 h-8 rounded-lg bg-bg-tertiary hover:bg-border border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          title="Mover abajo"
                        >
                          <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(languageCode, index)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 transition-colors flex items-center justify-center"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-text-secondary text-sm mb-3">
                  No hay preguntas en este idioma
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addQuestion(languageCode)}
                >
                  Agregar Primera Pregunta
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
