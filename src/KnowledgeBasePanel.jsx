import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const FALLBACK_SUPPORTED_LANGUAGES = ["ko", "en"];
const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER", "MEMBER"];

const LANGUAGE_LABELS = {
  ko: "한국어",
  en: "English",
};

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0 ? userLike.roles : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

function hasAnyRole(userLike, roles) {
  const userRoles = normalizeRoles(userLike);
  return roles.some((role) => userRoles.includes(role));
}

function createTranslationForm() {
  return {
    title: "",
    summary: "",
    content: "",
    tags: "",
  };
}

function createCategoryTranslationForm() {
  return {
    name: "",
    description: "",
  };
}

function createTranslationForms(supportedLanguages, factory) {
  return supportedLanguages.reduce((translations, languageCode) => {
    translations[languageCode] = factory();
    return translations;
  }, {});
}

function createItemForm(defaultCategoryId = "", supportedLanguages = FALLBACK_SUPPORTED_LANGUAGES) {
  return {
    categoryId: defaultCategoryId,
    status: "PUBLISHED",
    displayOrder: 10,
    decisionDate: "",
    effectiveFrom: "",
    effectiveTo: "",
    sourceNote: "",
    translations: createTranslationForms(supportedLanguages, createTranslationForm),
  };
}

function createCategoryForm(supportedLanguages = FALLBACK_SUPPORTED_LANGUAGES) {
  return {
    displayOrder: 10,
    translations: createTranslationForms(supportedLanguages, createCategoryTranslationForm),
  };
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDateInputValue(value) {
  return value || "";
}

function formatDate(value, languageCode, emptyLabel = "-") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(languageCode === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value, languageCode, emptyLabel = "-") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(languageCode === "en" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTranslation(entity, languageCode, defaultLanguage, emptyTranslation) {
  const selectedTranslation = entity?.translations?.[languageCode];
  const defaultTranslation = entity?.translations?.[defaultLanguage];

  return {
    value: selectedTranslation || defaultTranslation || emptyTranslation,
    missing: !selectedTranslation,
  };
}

function hasAnyValue(translation) {
  return Object.values(translation).some((value) => String(value || "").trim());
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    />
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Notice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return <div className={`rounded-lg border px-3 py-2 text-sm leading-6 ${className}`}>{children}</div>;
}

function MissingBadge({ show, label }) {
  if (!show) {
    return null;
  }

  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
      {label}
    </span>
  );
}

function LanguageTabs({ supportedLanguages, activeLanguage, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {supportedLanguages.map((languageCode) => (
        <button
          key={languageCode}
          type="button"
          onClick={() => onChange(languageCode)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            activeLanguage === languageCode
              ? "border-teal-600 bg-teal-700 text-white"
              : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {LANGUAGE_LABELS[languageCode] || languageCode}
        </button>
      ))}
    </div>
  );
}

function TagList({ tags }) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
          {tag}
        </span>
      ))}
    </div>
  );
}

export default function KnowledgeBasePanel({ token, currentUser, labels, langCd }) {
  const kb = labels.knowledgeBase;
  const canManage = hasAnyRole(currentUser, ["SUPER_ADMIN", "STAFF"]);
  const preferredLanguage = langCd === "Eng" ? "en" : "ko";

  const [defaultLanguage, setDefaultLanguage] = useState("ko");
  const [supportedLanguages, setSupportedLanguages] = useState(FALLBACK_SUPPORTED_LANGUAGES);
  const [manualLanguage, setManualLanguage] = useState(preferredLanguage);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeItemFormLanguage, setActiveItemFormLanguage] = useState(preferredLanguage);
  const [activeCategoryFormLanguage, setActiveCategoryFormLanguage] = useState(preferredLanguage);
  const [itemForm, setItemForm] = useState(() => createItemForm("", FALLBACK_SUPPORTED_LANGUAGES));
  const [editingItemId, setEditingItemId] = useState(null);
  const [categoryForm, setCategoryForm] = useState(() => createCategoryForm(FALLBACK_SUPPORTED_LANGUAGES));
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBootstrap = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await adminApi.bootstrapKnowledgeBase(token);
      const nextSupportedLanguages = data.supportedLanguages?.length ? data.supportedLanguages : FALLBACK_SUPPORTED_LANGUAGES;
      const nextDefaultLanguage = data.defaultLanguage || "ko";

      setDefaultLanguage(nextDefaultLanguage);
      setSupportedLanguages(nextSupportedLanguages);
      setCategories(data.categories || []);
      setItems(data.items || []);
      setManualLanguage((currentLanguage) =>
        nextSupportedLanguages.includes(currentLanguage) ? currentLanguage : nextDefaultLanguage
      );
      setSelectedItemId((currentId) => {
        if (data.items?.some((item) => item.id === currentId)) {
          return currentId;
        }
        return data.items?.[0]?.id || null;
      });
      setItemForm((currentForm) => ({
        ...currentForm,
        categoryId: currentForm.categoryId || data.categories?.[0]?.id || "",
        translations: normalizeItemFormTranslations(currentForm.translations, nextSupportedLanguages),
      }));
      setCategoryForm((currentForm) => ({
        ...currentForm,
        translations: normalizeCategoryFormTranslations(currentForm.translations, nextSupportedLanguages),
      }));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return items.filter((item) => {
      const matchesCategory = categoryId === "ALL" || item.categoryId === Number(categoryId);
      const category = categories.find((candidate) => candidate.id === item.categoryId);
      const categoryText = Object.values(category?.translations || {})
        .flatMap((translation) => [translation.name, translation.description])
        .join(" ");
      const itemText = Object.values(item.translations || {})
        .flatMap((translation) => [
          translation.title,
          translation.summary,
          translation.content,
          ...(translation.tags || []),
        ])
        .join(" ");
      const haystack = `${categoryText} ${itemText}`.toLowerCase();

      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [categories, categoryId, items, query]);

  const selectedItem = useMemo(() => {
    if (filteredItems.some((item) => item.id === selectedItemId)) {
      return filteredItems.find((item) => item.id === selectedItemId);
    }
    return filteredItems[0] || null;
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (selectedItem && selectedItem.id !== selectedItemId) {
      setSelectedItemId(selectedItem.id);
    }
  }, [selectedItem, selectedItemId]);

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm(createItemForm(categories[0]?.id || "", supportedLanguages));
    setActiveItemFormLanguage(manualLanguage);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(createCategoryForm(supportedLanguages));
    setActiveCategoryFormLanguage(manualLanguage);
  };

  const handleCommonItemChange = (event) => {
    const { name, value } = event.target;
    setItemForm((currentForm) => ({
      ...currentForm,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  const handleItemTranslationChange = (event) => {
    const { name, value } = event.target;
    setItemForm((currentForm) => ({
      ...currentForm,
      translations: {
        ...currentForm.translations,
        [activeItemFormLanguage]: {
          ...currentForm.translations[activeItemFormLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleCategoryCommonChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((currentForm) => ({
      ...currentForm,
      [name]: name === "displayOrder" ? Number(value) : value,
    }));
  };

  const handleCategoryTranslationChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((currentForm) => ({
      ...currentForm,
      translations: {
        ...currentForm.translations,
        [activeCategoryFormLanguage]: {
          ...currentForm.translations[activeCategoryFormLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleEditItem = (item) => {
    const translations = supportedLanguages.reduce((nextTranslations, languageCode) => {
      const translation = item.translations?.[languageCode];
      nextTranslations[languageCode] = {
        title: translation?.title || "",
        summary: translation?.summary || "",
        content: translation?.content || "",
        tags: (translation?.tags || []).join(", "),
      };
      return nextTranslations;
    }, {});

    setEditingItemId(item.id);
    setItemForm({
      categoryId: item.categoryId,
      status: item.status,
      displayOrder: item.displayOrder,
      decisionDate: toDateInputValue(item.decisionDate),
      effectiveFrom: toDateInputValue(item.effectiveFrom),
      effectiveTo: toDateInputValue(item.effectiveTo),
      sourceNote: item.sourceNote || "",
      translations,
    });
    setActiveItemFormLanguage(manualLanguage);
    setNotice("");
    setError("");
  };

  const handleSubmitItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    const payload = {
      categoryId: Number(itemForm.categoryId),
      status: itemForm.status,
      displayOrder: Number(itemForm.displayOrder),
      decisionDate: itemForm.decisionDate || null,
      effectiveFrom: itemForm.effectiveFrom || null,
      effectiveTo: itemForm.effectiveTo || null,
      sourceNote: itemForm.sourceNote.trim() || null,
      translations: buildItemTranslationsPayload(itemForm.translations, supportedLanguages, defaultLanguage),
    };

    try {
      const savedItem = editingItemId
        ? await adminApi.updateKnowledgeItem(token, editingItemId, payload)
        : await adminApi.createKnowledgeItem(token, payload);

      setNotice(editingItemId ? kb.itemUpdated : kb.itemCreated);
      resetItemForm();
      await loadBootstrap();
      setSelectedItemId(savedItem.status === "PUBLISHED" ? savedItem.id : null);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const itemTranslation = getTranslation(item, manualLanguage, defaultLanguage, {}).value;
    if (!window.confirm(kb.confirmDeleteItem(itemTranslation.title || String(item.id)))) {
      return;
    }

    setNotice("");
    setError("");

    try {
      await adminApi.deleteKnowledgeItem(token, item.id);
      setNotice(kb.itemDeleted);
      resetItemForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const handleEditCategory = (category) => {
    const translations = supportedLanguages.reduce((nextTranslations, languageCode) => {
      const translation = category.translations?.[languageCode];
      nextTranslations[languageCode] = {
        name: translation?.name || "",
        description: translation?.description || "",
      };
      return nextTranslations;
    }, {});

    setEditingCategoryId(category.id);
    setCategoryForm({
      displayOrder: category.displayOrder,
      translations,
    });
    setActiveCategoryFormLanguage(manualLanguage);
    setNotice("");
    setError("");
  };

  const handleSubmitCategory = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    const payload = {
      displayOrder: Number(categoryForm.displayOrder),
      translations: buildCategoryTranslationsPayload(categoryForm.translations, supportedLanguages, defaultLanguage),
    };

    try {
      await (editingCategoryId
        ? adminApi.updateKnowledgeCategory(token, editingCategoryId, payload)
        : adminApi.createKnowledgeCategory(token, payload));

      setNotice(editingCategoryId ? kb.categoryUpdated : kb.categoryCreated);
      resetCategoryForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {}).value;
    if (!window.confirm(kb.confirmDeleteCategory(categoryTranslation.name || String(category.id)))) {
      return;
    }

    setNotice("");
    setError("");

    try {
      await adminApi.deleteKnowledgeCategory(token, category.id);
      setNotice(kb.categoryDeleted);
      resetCategoryForm();
      await loadBootstrap();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const selectedItemTranslation = getTranslation(selectedItem, manualLanguage, defaultLanguage, {
    title: "",
    summary: "",
    content: "",
    tags: [],
  });
  const selectedCategory = categories.find((category) => category.id === selectedItem?.categoryId);
  const selectedCategoryTranslation = getTranslation(selectedCategory, manualLanguage, defaultLanguage, {
    name: "",
    description: "",
  });

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px_240px]">
          <Field label={kb.searchLabel}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={kb.searchPlaceholder}
            />
          </Field>
          <Field label={kb.categoryFilter}>
            <SelectInput value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="ALL">{kb.allCategories}</option>
              {categories.map((category) => {
                const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                  name: "",
                  description: "",
                });
                return (
                  <option key={category.id} value={category.id}>
                    {categoryTranslation.value.name || category.id}
                  </option>
                );
              })}
            </SelectInput>
          </Field>
          <Field label={kb.manualLanguage}>
            <SelectInput value={manualLanguage} onChange={(event) => setManualLanguage(event.target.value)}>
              {supportedLanguages.map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {LANGUAGE_LABELS[languageCode] || languageCode}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="mt-4 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
            <h2 className="text-lg font-bold text-zinc-950">{kb.resultsTitle}</h2>
            <span className="text-sm text-zinc-500">
              {isLoading ? labels.common.loading : labels.common.count(filteredItems.length)}
            </span>
          </div>

          <div className="mt-4 grid max-h-[640px] gap-3 overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm leading-6 text-zinc-500">
                {kb.noResults}
              </div>
            ) : null}

            {filteredItems.map((item) => {
              const itemTranslation = getTranslation(item, manualLanguage, defaultLanguage, {
                title: "",
                summary: "",
                content: "",
                tags: [],
              });
              const category = categories.find((candidate) => candidate.id === item.categoryId);
              const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                name: "",
                description: "",
              });

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selectedItem?.id === item.id
                      ? "border-teal-300 bg-teal-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700">{categoryTranslation.value.name}</span>
                    <MissingBadge show={categoryTranslation.missing || itemTranslation.missing} label={kb.translationMissing} />
                  </div>
                  <div className="mt-1 text-base font-bold text-zinc-950">{itemTranslation.value.title}</div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{itemTranslation.value.summary}</p>
                  <div className="mt-3">
                    <TagList tags={itemTranslation.value.tags} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          {selectedItem ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-teal-700">{selectedCategoryTranslation.value.name}</span>
                    <MissingBadge show={selectedCategoryTranslation.missing || selectedItemTranslation.missing} label={kb.translationMissing} />
                  </div>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{selectedItemTranslation.value.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{selectedItemTranslation.value.summary}</p>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditItem(selectedItem)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      {labels.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(selectedItem)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      {labels.common.delete}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <TagList tags={selectedItemTranslation.value.tags} />
              </div>

              <div className="mt-5 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-800">
                {selectedItemTranslation.value.content}
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Info label={kb.decisionDate} value={formatDate(selectedItem.decisionDate, manualLanguage, labels.common.empty)} />
                <Info label={kb.effectiveFrom} value={formatDate(selectedItem.effectiveFrom, manualLanguage, labels.common.empty)} />
                <Info label={kb.effectiveTo} value={formatDate(selectedItem.effectiveTo, manualLanguage, labels.common.empty)} />
                <Info label={kb.lastUpdated} value={formatDateTime(selectedItem.updatedAt, manualLanguage, labels.common.empty)} />
              </dl>

              <div className="mt-4 rounded-lg border border-zinc-200 p-4">
                <div className="text-xs font-semibold text-zinc-500">{kb.sourceNote}</div>
                <div className="mt-1 text-sm leading-6 text-zinc-700">{selectedItem.sourceNote || labels.common.empty}</div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">
              {kb.selectItem}
            </div>
          )}
        </div>
      </div>

      {canManage ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <form onSubmit={handleSubmitItem} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
              <h2 className="text-lg font-bold text-zinc-950">
                {editingItemId ? kb.editItemTitle : kb.createItemTitle}
              </h2>
              {editingItemId ? (
                <button type="button" onClick={resetItemForm} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
                  {labels.common.cancel}
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field label={kb.category}>
                <SelectInput name="categoryId" value={itemForm.categoryId} onChange={handleCommonItemChange}>
                  {categories.map((category) => {
                    const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                      name: "",
                      description: "",
                    });
                    return (
                      <option key={category.id} value={category.id}>
                        {categoryTranslation.value.name || category.id}
                      </option>
                    );
                  })}
                </SelectInput>
              </Field>
              <Field label={kb.status}>
                <SelectInput name="status" value={itemForm.status} onChange={handleCommonItemChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {kb.statuses[status]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={kb.decisionDate}>
                <TextInput name="decisionDate" type="date" value={itemForm.decisionDate} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.effectiveFrom}>
                <TextInput name="effectiveFrom" type="date" value={itemForm.effectiveFrom} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.effectiveTo}>
                <TextInput name="effectiveTo" type="date" value={itemForm.effectiveTo} onChange={handleCommonItemChange} />
              </Field>
              <Field label={kb.displayOrder}>
                <TextInput name="displayOrder" type="number" value={itemForm.displayOrder} onChange={handleCommonItemChange} />
              </Field>
              <div className="lg:col-span-2">
                <Field label={kb.sourceNote}>
                  <TextInput name="sourceNote" value={itemForm.sourceNote} onChange={handleCommonItemChange} />
                </Field>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-5">
              <LanguageTabs
                supportedLanguages={supportedLanguages}
                activeLanguage={activeItemFormLanguage}
                onChange={setActiveItemFormLanguage}
              />
              <div className="mt-4 grid gap-4">
                <Field label={activeItemFormLanguage === "en" ? "Title" : kb.title}>
                  <TextInput
                    name="title"
                    value={itemForm.translations[activeItemFormLanguage]?.title || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Summary" : kb.summary}>
                  <TextArea
                    name="summary"
                    rows={3}
                    value={itemForm.translations[activeItemFormLanguage]?.summary || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Content" : kb.content}>
                  <TextArea
                    name="content"
                    rows={8}
                    value={itemForm.translations[activeItemFormLanguage]?.content || ""}
                    onChange={handleItemTranslationChange}
                  />
                </Field>
                <Field label={activeItemFormLanguage === "en" ? "Tags" : kb.tags}>
                  <TextInput
                    name="tags"
                    value={itemForm.translations[activeItemFormLanguage]?.tags || ""}
                    onChange={handleItemTranslationChange}
                    placeholder={kb.tagsPlaceholder}
                  />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || categories.length === 0}
              className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {isSaving ? labels.common.saving : editingItemId ? labels.common.save : labels.common.create}
            </button>
          </form>

          <div className="grid gap-5">
            <form onSubmit={handleSubmitCategory} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingCategoryId ? kb.editCategoryTitle : kb.createCategoryTitle}
                </h2>
                {editingCategoryId ? (
                  <button type="button" onClick={resetCategoryForm} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
                    {labels.common.cancel}
                  </button>
                ) : null}
              </div>

              <div className="mt-4">
                <Field label={kb.displayOrder}>
                  <TextInput name="displayOrder" type="number" value={categoryForm.displayOrder} onChange={handleCategoryCommonChange} />
                </Field>
              </div>

              <div className="mt-5 border-t border-zinc-200 pt-5">
                <LanguageTabs
                  supportedLanguages={supportedLanguages}
                  activeLanguage={activeCategoryFormLanguage}
                  onChange={setActiveCategoryFormLanguage}
                />
                <div className="mt-4 grid gap-4">
                  <Field label={activeCategoryFormLanguage === "en" ? "Category Name" : kb.categoryName}>
                    <TextInput
                      name="name"
                      value={categoryForm.translations[activeCategoryFormLanguage]?.name || ""}
                      onChange={handleCategoryTranslationChange}
                    />
                  </Field>
                  <Field label={activeCategoryFormLanguage === "en" ? "Description" : kb.categoryDescription}>
                    <TextArea
                      name="description"
                      rows={3}
                      value={categoryForm.translations[activeCategoryFormLanguage]?.description || ""}
                      onChange={handleCategoryTranslationChange}
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {isSaving ? labels.common.saving : editingCategoryId ? labels.common.save : labels.common.create}
              </button>
            </form>

            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-950">{kb.categoryListTitle}</h2>
              <div className="mt-4 grid gap-2">
                {categories.map((category) => {
                  const categoryTranslation = getTranslation(category, manualLanguage, defaultLanguage, {
                    name: "",
                    description: "",
                  });
                  return (
                    <div key={category.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900">{categoryTranslation.value.name}</span>
                            <MissingBadge show={categoryTranslation.missing} label={kb.translationMissing} />
                          </div>
                          <div className="mt-1 text-xs leading-5 text-zinc-500">{categoryTranslation.value.description}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(category)}
                            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            {labels.common.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            {labels.common.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function normalizeItemFormTranslations(translations, supportedLanguages) {
  return supportedLanguages.reduce((nextTranslations, languageCode) => {
    nextTranslations[languageCode] = {
      ...createTranslationForm(),
      ...(translations?.[languageCode] || {}),
    };
    return nextTranslations;
  }, {});
}

function normalizeCategoryFormTranslations(translations, supportedLanguages) {
  return supportedLanguages.reduce((nextTranslations, languageCode) => {
    nextTranslations[languageCode] = {
      ...createCategoryTranslationForm(),
      ...(translations?.[languageCode] || {}),
    };
    return nextTranslations;
  }, {});
}

function buildItemTranslationsPayload(translations, supportedLanguages, defaultLanguage) {
  return supportedLanguages.reduce((payload, languageCode) => {
    const translation = translations[languageCode] || createTranslationForm();
    if (languageCode === defaultLanguage || hasAnyValue(translation)) {
      payload[languageCode] = {
        title: translation.title.trim(),
        summary: translation.summary.trim(),
        content: translation.content.trim(),
        tags: splitTags(translation.tags),
      };
    }
    return payload;
  }, {});
}

function buildCategoryTranslationsPayload(translations, supportedLanguages, defaultLanguage) {
  return supportedLanguages.reduce((payload, languageCode) => {
    const translation = translations[languageCode] || createCategoryTranslationForm();
    if (languageCode === defaultLanguage || hasAnyValue(translation)) {
      payload[languageCode] = {
        name: translation.name.trim(),
        description: translation.description.trim() || null,
      };
    }
    return payload;
  }, {});
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <dt className="text-xs font-semibold text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}
