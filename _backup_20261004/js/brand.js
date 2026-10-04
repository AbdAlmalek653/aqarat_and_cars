/* ==========================================
   brand.js - تغيير عنوان المنصة
   من: سوق
   إلى: منصة بُنيان للوساطة الإلكترونية
   ========================================== */

(function() {
  'use strict';

  // ✅ الاسم الجديد
  const NEW_NAME = 'منصة بُنيان للوساطة الإلكترونية';
  const NEW_NAME_SHORT = 'بُنيان'; // ← للاستخدام في الأماكن الضيقة

  // ✅ النصوص المستثناة (ما نغيرهن)
  const EXCLUDE_SELECTORS = [
    'script',
    'style',
    'noscript',
    'code',
    'pre',
    'textarea',
    'input',
    '.card-details-btn'
  ];

  /**
   * التحقق إذا كان العنصر أو أحد آبائه مستثنى
   */
  function isExcluded(node) {
    let el = node.parentElement;
    while (el) {
      for (const sel of EXCLUDE_SELECTORS) {
        if (el.matches && el.matches(sel)) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  /**
   * استبدال النص في كل الـ text nodes
   */
  function replaceTextNodes(root, oldText, newText) {
    if (!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // تجاهل العناصر المستثناة
          if (isExcluded(node)) return NodeFilter.FILTER_REJECT;
          
          // تجاهل النصوص الفارغة
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          
          // ✅ لا نغيّر إذا ما فيه "سوق"
          if (!node.nodeValue.includes(oldText)) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let n;
    while (n = walker.nextNode()) {
      nodes.push(n);
    }

    nodes.forEach(node => {
      // استبدال كل "سوق" بـ "منصة بُنيان للوساطة الإلكترونية"
      node.nodeValue = node.nodeValue.split(oldText).join(newText);
    });
  }

  /**
   * تغيير عنوان الصفحة (Title)
   */
  function updatePageTitle() {
    const currentTitle = document.title;
    if (currentTitle && currentTitle.includes('سوق')) {
      document.title = currentTitle.split('سوق').join('بُنيان');
    }
  }

  /**
   * تغيير meta description
   */
  function updateMetaDescription() {
    const metas = document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[property="og:title"], meta[name="twitter:title"], meta[name="twitter:description"]');
    metas.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content && content.includes('سوق')) {
        meta.setAttribute('content', content.split('سوق').join('بُنيان'));
      }
    });
  }

  /**
   * تشغيل عند تحميل الصفحة
   */
  function init() {
    // 1. تغيير العنوان
    updatePageTitle();

    // 2. تغيير meta tags
    updateMetaDescription();

    // 3. تغيير النص في body
    if (document.body) {
      replaceTextNodes(document.body, 'سوق', 'بُنيان');
    }

    // ✅ أيضاً في head (للـ title وجزئيات أخرى)
    if (document.head) {
      replaceTextNodes(document.head, 'سوق', 'بُنيان');
    }
  }

  // ✅ التشغيل
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ✅ مراقبة DOM للتغييرات الديناميكية (مثلاً بطاقات تُضاف لاحقاً)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          replaceTextNodes(node, 'سوق', 'بُنيان');
        } else if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue && node.nodeValue.includes('سوق')) {
            node.nodeValue = node.nodeValue.split('سوق').join('بُنيان');
          }
        }
      });
    });
  });

  // ابدأ المراقبة بعد تحميل DOM
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

})();