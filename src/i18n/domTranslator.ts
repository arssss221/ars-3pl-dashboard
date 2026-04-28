import i18n from './i18n';

let originalTextNodes = new WeakMap<Text, string>();
let originalAttributes = new WeakMap<Element, Map<string, string>>();
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'];

type TermsMap = Record<string, string>;

const buildCaseIndex = (terms: TermsMap) => {
  const index = new Map<string, string>();
  Object.entries(terms).forEach(([key, value]) => {
    index.set(key.toLowerCase(), value);
  });
  return index;
};

const getTerms = (language: string): TermsMap => {
  const bundle = i18n.getResourceBundle(language, 'translation') as
    | { terms?: TermsMap }
    | undefined;
  return bundle?.terms ?? {};
};

const translateToken = (
  token: string,
  terms: TermsMap,
  caseIndex: Map<string, string>
) => {
  const compact = token.replace(/\s+/g, ' ').trim();
  if (!compact) return token;

  const exact = terms[compact] ?? caseIndex.get(compact.toLowerCase());
  if (exact) return exact;

  const countMatch = compact.match(/^(.+?)\s*\(([\d/]+)\)$/);
  if (countMatch) {
    const translated =
      terms[countMatch[1].trim()] ??
      caseIndex.get(countMatch[1].trim().toLowerCase());
    if (translated) return `${translated} (${countMatch[2]})`;
  }

  const ratioMatch = compact.match(/^(\d+\/\d+)\s+(.+)$/);
  if (ratioMatch) {
    const translated =
      terms[ratioMatch[2].trim()] ??
      caseIndex.get(ratioMatch[2].trim().toLowerCase());
    if (translated) return `${ratioMatch[1]} ${translated}`;
  }

  return token;
};

const translateText = (
  source: string,
  terms: TermsMap,
  caseIndex: Map<string, string>,
  language: string
) => {
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  const core = source.trim();
  if (!core || /^[-–—•|/\\0-9.,:%+()#]+$/.test(core)) return source;

  if (language === 'ar') {
    const sentencePatterns: Array<[
      RegExp,
      (match: RegExpMatchArray) => string,
    ]> = [
      [/^Last\s+(\d+)\s+activity messages$/i, (match) => `آخر ${match[1]} رسائل نشاط`],
      [/^(\d+)\s+rider profiles have incomplete agreement, commitment, or insurance data\.$/i, (match) => `${match[1]} ملفات ركاب تحتاج مراجعة الوثائق.`],
      [/^(\d+)\s+riders are expired or within 30 days of expiry\.$/i, (match) => `${match[1]} ركاب منتهية إقامتهم أو خلال 30 يوما من الانتهاء.`],
      [/^(\d+)\s+vehicles have permit, insurance, or authorization risk\.$/i, (match) => `${match[1]} مركبات لديها مخاطر تصريح أو تأمين أو تفويض.`],
      [/^(\d+)\s+SAR remains open in rider transactions\.$/i, (match) => `${match[1]} ريال ما زالت مفتوحة في معاملات الركاب.`],
      [/^(\d+)\s+vehicle workflow items are waiting for next action\.$/i, (match) => `${match[1]} إجراءات مركبات بانتظار الخطوة التالية.`],
      [/^(.+)\s+iqama follow-up$/i, (match) => `${match[1]} متابعة الإقامة`],
      [/^Iqama already expired\. Please update the rider profile\.$/i, () => 'الإقامة منتهية. يرجى تحديث ملف الراكب.'],
      [/^(\d+)\s+days?\s+left before iqama expiry\.$/i, (match) => `متبقي ${match[1]} يوم قبل انتهاء الإقامة.`],
      [/^(\d+)\s+min ago$/i, (match) => `منذ ${match[1]} دقائق`],
      [/^Iqama expired\s+(\d+)\s+days ago$/i, (match) => `انتهت الإقامة منذ ${match[1]} يوم`],
      [/^(.+)\s+needs review$/i, (match) => `${match[1]} يحتاج مراجعة`],
      [/^Permit, insurance, or authorization date needs attention\.$/i, () => 'تاريخ التصريح أو التأمين أو التفويض يحتاج متابعة.'],
      [/^(\d+)\s+users assigned$/i, (match) => `${match[1]} مستخدمين معينين`],
      [/^(\d+)\s+rider profiles can be reviewed from this account\.$/i, (match) => `${match[1]} ملفات ركاب يمكن مراجعتها من هذا الحساب.`],
      [/^(\d+)\s+vehicle records are available for workflow tracking\.$/i, (match) => `${match[1]} سجلات مركبات متاحة لمتابعة الإجراءات.`],
      [/^Primary timezone is\s+(.+)\.$/i, (match) => `المنطقة الزمنية الأساسية هي ${match[1]}.`],
    ];

    const translatedSentence = sentencePatterns
      .map(([pattern, resolve]) => {
        const match = core.match(pattern);
        return match ? resolve(match) : null;
      })
      .find(Boolean);

    if (translatedSentence) {
      return `${leading}${translatedSentence}${trailing}`;
    }
  }

  const directTranslation = translateToken(core, terms, caseIndex);
  if (directTranslation !== core) {
    return `${leading}${directTranslation}${trailing}`;
  }

  if (language === 'ar') {
    const sarMatch = core.match(/^([\d,]+)\s+SAR(?:\s+(.+))?$/i);
    if (sarMatch) {
      const suffix = sarMatch[2]
        ? ` ${translateToken(sarMatch[2], terms, caseIndex)}`
        : '';
      return `${leading}${sarMatch[1]} ريال${suffix}${trailing}`;
    }
  }

  const numberWordMatch = core.match(/^(\d+)\s+(.+)$/);
  if (numberWordMatch) {
    const translated =
      terms[numberWordMatch[2].trim()] ??
      caseIndex.get(numberWordMatch[2].trim().toLowerCase());
    if (translated) {
      return `${leading}${numberWordMatch[1]} ${translated}${trailing}`;
    }
  }

  const colonMatch = core.match(/^(.+?):\s*(.+)$/);
  if (colonMatch) {
    return `${leading}${translateToken(
      colonMatch[1],
      terms,
      caseIndex
    )}: ${translateToken(colonMatch[2], terms, caseIndex)}${trailing}`;
  }

  if (core.includes(' • ')) {
    return `${leading}${core
      .split(' • ')
      .map((part) => translateToken(part, terms, caseIndex))
      .join(' • ')}${trailing}`;
  }

  if (core.includes(', ')) {
    return `${leading}${core
      .split(', ')
      .map((part) => translateToken(part, terms, caseIndex))
      .join(', ')}${trailing}`;
  }

  if (core.includes('\t')) {
    return `${leading}${core
      .split('\t')
      .map((part) => translateToken(part, terms, caseIndex))
      .join('\t')}${trailing}`;
  }

  return `${leading}${directTranslation}${trailing}`;
};

const translateElementAttributes = (
  root: HTMLElement,
  language: string,
  terms: TermsMap,
  caseIndex: Map<string, string>
) => {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  elements.forEach((element) => {
    if (element.closest('[data-no-translate]')) return;

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
      const currentValue = element.getAttribute(attribute);
      if (!currentValue?.trim()) return;

      let attributeStore = originalAttributes.get(element);
      if (!attributeStore) {
        attributeStore = new Map<string, string>();
        originalAttributes.set(element, attributeStore);
      }

      if (!attributeStore.has(attribute)) {
        attributeStore.set(attribute, currentValue);
      }

      let originalValue = attributeStore.get(attribute) ?? currentValue;
      const translatedOriginal = translateText(
        originalValue,
        terms,
        caseIndex,
        language
      );

      if (
        language === 'ar' &&
        currentValue !== originalValue &&
        currentValue !== translatedOriginal
      ) {
        originalValue = currentValue;
        attributeStore.set(attribute, originalValue);
      }

      const nextValue =
        language === 'ar'
          ? translateText(originalValue, terms, caseIndex, language)
          : originalValue;

      if (currentValue !== nextValue) {
        element.setAttribute(attribute, nextValue);
      }
    });
  });
};

export const applyDomTranslations = (root: HTMLElement, language: string) => {
  if (language !== 'ar') return;

  const terms = getTerms(language);
  const caseIndex = buildCaseIndex(terms);
  translateElementAttributes(root, language, terms, caseIndex);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('[data-no-translate]')) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, node.nodeValue ?? '');
    }

    let original = originalTextNodes.get(node) ?? '';
    const translatedOriginal = translateText(
      original,
      terms,
      caseIndex,
      language
    );

    if (
      language === 'ar' &&
      node.nodeValue !== original &&
      node.nodeValue !== translatedOriginal
    ) {
      original = node.nodeValue ?? '';
      originalTextNodes.set(node, original);
    }

    const nextValue =
      language === 'ar'
        ? translateText(original, terms, caseIndex, language)
        : original;

    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
  });
};

export const restoreDomTranslations = (root: HTMLElement) => {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  elements.forEach((element) => {
    const attributeStore = originalAttributes.get(element);
    if (!attributeStore) return;

    attributeStore.forEach((value, attribute) => {
      if (element.getAttribute(attribute) !== value) {
        element.setAttribute(attribute, value);
      }
    });
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return originalTextNodes.has(node as Text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const original = originalTextNodes.get(node);
    if (original !== undefined && node.nodeValue !== original) {
      node.nodeValue = original;
    }
  });
};

export const resetDomTranslationMemory = () => {
  originalTextNodes = new WeakMap<Text, string>();
  originalAttributes = new WeakMap<Element, Map<string, string>>();
};
