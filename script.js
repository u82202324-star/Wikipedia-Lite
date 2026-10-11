let currentLang = 'ar';
let currentArticleTitle = '';
let favorites = JSON.parse(localStorage.getItem('wiki_favs') || '[]');

const translations = {
  ar: { 
    dir: 'rtl', 
    siteTitle: 'ويكيبيديا', 
    placeholder: 'بحث...', 
    search: 'بحث', 
    random: 'مقالة عشوائية', 
    loading: 'جاري التحميل...', 
    error: 'حدث خطأ.', 
    notFound: 'لم يتم العثور على نتائج', 
    footerText: 'رابط المقالة:', 
    copyBtn: 'نسخ', 
    copied: 'تم!', 
    menuTitle: 'القائمة', 
    toggleTheme: 'تبديل الوضع', 
    favs: 'المفضلة', 
    close: 'إغلاق', 
    changeLang: 'اللغة:',
    opensourceText: 'هذا المشروع مفتوح المصدر',
    opensourceLink: 'انقر هنا لفتح المشروع على Github'
  },
  en: { 
    dir: 'ltr', 
    siteTitle: 'Wikipedia', 
    placeholder: 'Search...', 
    search: 'Search', 
    random: 'Random Article', 
    loading: 'Loading...', 
    error: 'Error occurred.', 
    notFound: 'No results found', 
    footerText: 'Article link:', 
    copyBtn: 'Copy', 
    copied: 'Done!', 
    menuTitle: 'Menu', 
    toggleTheme: 'Toggle Theme', 
    favs: 'Favorites', 
    close: 'Close', 
    changeLang: 'Language:',
    opensourceText: 'This project is open source',
    opensourceLink: 'Click here to open the project on Github'
  },
  fr: { 
    dir: 'ltr', 
    siteTitle: 'Wikipédia', 
    placeholder: 'Recherche...', 
    search: 'Chercher', 
    random: 'Article au hasard', 
    loading: 'Chargement...', 
    error: 'Erreur.', 
    notFound: 'Aucun résultat', 
    footerText: 'Lien de l\'article :', 
    copyBtn: 'Copier', 
    copied: 'Copié !', 
    menuTitle: 'Menu', 
    toggleTheme: 'Changer Thème', 
    favs: 'Favoris', 
    close: 'Fermer', 
    changeLang: 'Langue :',
    opensourceText: 'Ce projet est open source',
    opensourceLink: 'Cliquez ici pour ouvrir le projet sur Github'
  }
};

window.onload = function() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
  document.getElementById('langModal').style.display = 'flex';
};

function setTheme(theme) {
  document.getElementById('htmlTag').setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.getElementById('htmlTag').getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function toggleMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('dropdownMenu').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('dropdownMenu').classList.remove('open');
}

function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('langModal').style.display = 'none';
  document.getElementById('langSelect').value = lang;
  
  const t = translations[lang];
  document.getElementById('htmlTag').dir = t.dir;
  document.getElementById('htmlTag').lang = lang;
  
  document.getElementById('siteTitle').innerText = t.siteTitle;
  document.title = t.siteTitle;

  document.getElementById('searchInput').placeholder = t.placeholder;
  document.getElementById('btnSearch').innerText = t.search;
  document.getElementById('footerLabel').innerText = t.footerText;
  document.getElementById('btnCopy').innerText = t.copyBtn;
  document.getElementById('menuTitle').innerText = t.menuTitle;
  document.getElementById('btnToggleTheme').innerText = t.toggleTheme;
  document.getElementById('menuRandom').innerText = t.random;
  document.getElementById('menuFav').innerText = t.favs;
  document.getElementById('labelChangeLang').innerText = t.changeLang;
  document.getElementById('favModalTitle').innerText = t.favs;
  document.getElementById('favCloseBtn').innerText = t.close;
  
  // تحديث نصوص المشروع مفتوح المصدر بناءً على اللغة
  document.getElementById('opensourceText').innerText = t.opensourceText;
  document.getElementById('opensourceLink').innerText = t.opensourceLink;

  if (currentArticleTitle) {
    fetchArticleContent(currentArticleTitle);
  } else {
    getRandomArticle();
  }
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.hamburger-container')) {
    closeMenu();
  }
  if (!e.target.closest('.search-container')) {
    document.getElementById('suggestions').style.display = 'none';
  }
});

function getSuggestions(query) {
  const box = document.getElementById('suggestions');
  if (!query.trim()) {
    box.style.display = 'none';
    return;
  }

  fetch(`https://${currentLang}.wikipedia.org/w/api.php?action=query&generator=prefixsearch&gpssearch=${encodeURIComponent(query)}&gpslimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=60&origin=*&format=json`)
    .then(res => res.json())
    .then(data => {
      box.innerHTML = '';
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages).sort((a, b) => a.index - b.index);
        pages.forEach(page => {
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          
          if (page.thumbnail && page.thumbnail.source) {
            const img = document.createElement('img');
            img.src = page.thumbnail.source;
            div.appendChild(img);
          }

          const text = document.createElement('span');
          text.innerText = page.title;
          div.appendChild(text);

          div.onclick = function() {
            document.getElementById('searchInput').value = page.title;
            box.style.display = 'none';
            searchWiki(page.title);
          };
          box.appendChild(div);
        });
        box.style.display = 'block';
      } else {
        box.style.display = 'none';
      }
    })
    .catch(() => {
      box.style.display = 'none';
    });
}

function getRandomArticle() {
  const t = translations[currentLang];
  document.getElementById('content').innerText = t.loading;
  document.getElementById('articleTitle').innerText = '';
  document.getElementById('articleFooter').style.display = 'none';
  document.getElementById('favStarBtn').style.display = 'none';
  fetch(`https://${currentLang}.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=info&origin=*&format=json`)
    .then(res => res.json())
    .then(data => {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      fetchArticleContent(pages[pageId].title);
    })
    .catch(() => showError());
}

function searchWiki(title) {
  if (!title.trim()) return;
  const t = translations[currentLang];
  document.getElementById('suggestions').style.display = 'none';
  document.getElementById('content').innerText = t.loading;
  document.getElementById('articleTitle').innerText = '';
  document.getElementById('articleFooter').style.display = 'none';
  document.getElementById('favStarBtn').style.display = 'none';
  fetchArticleContent(title);
}

function fetchArticleContent(title) {
  currentArticleTitle = title;
  fetch(`https://${currentLang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|title&disableeditsection=1&mobileformat=1&origin=*&format=json`)
    .then(res => res.json())
    .then(data => {
      const t = translations[currentLang];
      if (data.error) {
        document.getElementById('articleTitle').innerText = t.notFound;
        document.getElementById('content').innerText = t.notFound;
        document.getElementById('articleFooter').style.display = 'none';
        document.getElementById('favStarBtn').style.display = 'none';
      } else {
        const actualTitle = data.parse.title;
        currentArticleTitle = actualTitle;
        document.getElementById('articleTitle').innerText = actualTitle;
        
        const star = document.getElementById('favStarBtn');
        star.style.display = 'inline-block';
        updateStarState();

        const wikiUrl = `https://${currentLang}.wikipedia.org/wiki/${encodeURIComponent(actualTitle)}`;
        document.getElementById('wikiLinkInput').value = wikiUrl;
        document.getElementById('articleFooter').style.display = 'block';

        const contentDiv = document.getElementById('content');
        
        let htmlText = data.parse.text['*'];
        htmlText = htmlText.replace(/src="\/\//g, 'src="https://');
        htmlText = htmlText.replace(/srcset="\/\//g, 'srcset="https://');
        htmlText = htmlText.replace(/src="\//g, `src="https://${currentLang}.wikipedia.org/`);
        
        contentDiv.innerHTML = htmlText;

        const images = contentDiv.querySelectorAll('img');
        images.forEach(img => {
          let srcset = img.getAttribute('srcset');
          if (srcset && srcset.includes('//')) {
            img.setAttribute('srcset', srcset.replace(/(^|\s)\/\//g, '$1https://'));
          }
        });

        const links = contentDiv.querySelectorAll('a');
        links.forEach(a => {
          let href = a.getAttribute('href');
          if (href) {
            if (href.startsWith('/wiki/')) {
              a.href = `https://${currentLang}.wikipedia.org${href}`;
            } else if (!href.startsWith('http') && !href.startsWith('#')) {
              a.href = `https://${currentLang}.wikipedia.org/${href}`;
            }
            a.setAttribute('target', '_blank');
          }
        });

        fixMediaPlayers(contentDiv);
      }
    })
    .catch(() => showError());
}

function updateStarState() {
  const star = document.getElementById('favStarBtn');
  const exists = favorites.some(f => f.title === currentArticleTitle && f.lang === currentLang);
  if (exists) {
    star.classList.add('active');
  } else {
    star.classList.remove('active');
  }
}

function toggleFavoriteCurrent() {
  const existsIndex = favorites.findIndex(f => f.title === currentArticleTitle && f.lang === currentLang);
  if (existsIndex > -1) {
    favorites.splice(existsIndex, 1);
  } else {
    favorites.push({ title: currentArticleTitle, lang: currentLang });
  }
  localStorage.setItem('wiki_favs', JSON.stringify(favorites));
  updateStarState();
}

function showFavorites() {
  const listDiv = document.getElementById('favList');
  listDiv.innerHTML = '';
  if (favorites.length === 0) {
    listDiv.innerHTML = '<p style="text-align:center; font-size:0.8rem;">لا توجد مفضلات.</p>';
  } else {
    favorites.forEach(fav => {
      const item = document.createElement('div');
      item.className = 'fav-item';
      item.innerHTML = `<span>${fav.title}</span> <span style="font-size:0.75rem;">[${fav.lang}]</span>`;
      item.onclick = function() {
        setLanguage(fav.lang);
        searchWiki(fav.title);
        closeFavorites();
      };
      listDiv.appendChild(item);
    });
  }
  document.getElementById('favModal').style.display = 'flex';
}

function closeFavorites() {
  document.getElementById('favModal').style.display = 'none';
}

function copyWikiLink() {
  const input = document.getElementById('wikiLinkInput');
  input.select();
  navigator.clipboard.writeText(input.value);
  const t = translations[currentLang];
  const btn = document.getElementById('btnCopy');
  const originalText = btn.innerText;
  btn.innerText = t.copied;
  setTimeout(() => { btn.innerText = originalText; }, 2000);
}

function fixMediaPlayers(container) {
  const mediaElements = container.querySelectorAll('video, audio, .mediaContainer, .mw-tmh-player, a.internal[href*=".ogv"], a.internal[href*=".webm"], a.internal[href*=".ogg"]');

  mediaElements.forEach(el => {
    let fileTitle = '';
    if (el.tagName === 'A' && el.href) {
      const parts = el.href.split('/');
      fileTitle = parts[parts.length - 1];
    } else if (el.querySelector('a')) {
      const a = el.querySelector('a');
      if (a.href) fileTitle = a.href.split('/').pop();
    }

    if (fileTitle) {
      fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${fileTitle}&prop=imageinfo&iiprop=url&origin=*&format=json`)
        .then(res => res.json())
        .then(data => {
          const pages = data.query.pages;
          const pageKey = Object.keys(pages)[0];
          if (pageKey !== "-1" && pages[pageKey].imageinfo) {
            const videoUrl = pages[pageKey].imageinfo[0].url;
            const newVideo = document.createElement('video');
            newVideo.src = videoUrl;
            newVideo.controls = true;
            if (el.parentNode) {
              el.parentNode.replaceChild(newVideo, el);
            }
          }
        }).catch(() => {});
    } else if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
      el.setAttribute('controls', 'true');
      let src = el.getAttribute('src');
      if (src && src.startsWith('//')) {
        el.src = 'https:' + src;
      }
    }
  });
}

function showError() {
  const t = translations[currentLang];
  document.getElementById('content').innerText = t.error;
    }
