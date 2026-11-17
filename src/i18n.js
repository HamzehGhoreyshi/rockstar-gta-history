/**
 * Interface language: English (default) and Persian (RTL, Ravi font).
 * The language comes from ?lang=fa in the address, so a Persian link can be shared.
 * Game content translations live in src/data/games.fa.js.
 */

export const LANGS = {
  en: {
    dir: 'ltr', native: 'English',
    title: 'Grand Theft Archive — Every GTA, 1997–2026',
    language: 'Choose language',
    sub: 'Every GTA · 1997 — 2026',
    countLabel: 'Games · 29 years',
    about: 'About',
    eras: { all: 'All', '2d': '2D Universe', '3d': '3D Universe', hd: 'HD Universe' },
    eraFilter: 'Era filter',
    prev: 'Previous game', next: 'Next game',
    openCase: 'Open case',
    browse: 'browse', open: 'open', close: 'close',
    jumpYear: 'Jump to a year',
    collection: 'Game collection',
    no: (i, n) => `No. ${i} / ${n}`,
    openHint: 'Open the case',
    openHintVi: 'Open the case — enter Vice City',
    releasesIn: 'Releases in',
    unlocksIn: 'Unlocks at midnight, local time, in',
    outNow: 'Out now',
    units: ['Days', 'Hours', 'Min', 'Sec'],
    closeCase: 'Close case', closeWord: 'Close',
    chapter: (i, n, era) => `Chapter ${i} of ${n} · ${era} Universe`,
    released: 'Released', madeFor: 'Made for', launchedOn: 'Launched on', developer: 'Developer', publisher: 'Publisher',
    metacritic: 'Metacritic', noScore: 'No score listed',
    setting: 'Setting', playingAs: 'Playing as', engine: 'Engine',
    productionFile: 'Production file', productionSub: 'What it took to make', productionSubVi: 'The biggest Rockstar production yet',
    budget: 'Budget', devTime: 'Development time', team: 'Team', sales: 'Copies sold', preorders: 'Pre-orders',
    notDisclosed: 'Not disclosed',
    remember: 'Remember this?',
    imagesFrom: (n, y) => `${n} ${n === '01' || n === '۰۱' ? 'image' : 'images'} from ${y}`,
    noteOfficial: 'Cover art and screenshots: official Rockstar Games material from rockstargames.com. Facts: Wikipedia (sources cited there). Disc label shows the cover art.',
    noteAdvance: 'Rockstar has no page for this game, so the logo, title screen and cartridge photo come via Wikipedia. Facts: Wikipedia.',
    openShot: (i, t) => `Open screenshot ${i} of ${t}`,
    viEyebrow: 'Hero of the collection · No physical disc',
    viTitle: 'Vice City, USA.',
    viCite: ' — Rockstar Games',
    platforms: 'Platforms', release: 'Release',
    viStorySrc: 'Paraphrased from Rockstar’s official synopsis.',
    launchGallery: 'Launch Gallery',
    officialShots: (n) => `${n} official screenshots`,
    officialScreens: 'Official screenshots',
    watch: (l) => `Watch ${l}`, onRockstar: ' on rockstargames.com ↗',
    viCredit: 'All GTA VI imagery is official Rockstar Games material, loaded directly from rockstargames.com/VI. This is a personal fan collection and is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.',
    nextChapter: '★ The next chapter',
    lbClose: 'Close', lbPrev: 'Previous image', lbNext: 'Next image', lbOfficial: 'Official · © Rockstar Games',
    aboutTitle: 'About this shelf',
    aboutBody: [
      'Every Grand Theft Auto, from the 1997 top-down original to GTA VI, on one shelf. Each game sits in the case of the console it was made for. Pull one out, open it, and look back.',
      'Facts — release dates, studios, budgets, development time, team size, sales, Metacritic — come from each game’s Wikipedia article and the reporting it cites. If a number was never made public, it says “Not disclosed” instead of guessing.',
      'Cover art and screenshots are official Rockstar Games material loaded from rockstargames.com (GTA Advance: Wikipedia). Disc labels show the cover art.',
    ],
    aboutLegal: 'Fan project. Not affiliated with or endorsed by Rockstar Games, Take-Two Interactive, Sony, Microsoft or Nintendo. All artwork © its owners.',
  },

  fa: {
    dir: 'rtl', native: 'فارسی',
    title: 'آرشیو جی‌تی‌ای — همه‌ی نسخه‌ها، ۱۹۹۷ تا ۲۰۲۶',
    language: 'انتخاب زبان',
    sub: 'همه‌ی جی‌تی‌ای‌ها · ۱۹۹۷ — ۲۰۲۶',
    countLabel: 'بازی · ۲۹ سال',
    about: 'درباره',
    eras: { all: 'همه', '2d': 'دنیای دوبعدی', '3d': 'دنیای سه‌بعدی', hd: 'دنیای HD' },
    eraFilter: 'فیلتر دوره',
    prev: 'بازی قبلی', next: 'بازی بعدی',
    openCase: 'باز کردن جعبه',
    browse: 'مرور', open: 'باز کردن', close: 'بستن',
    jumpYear: 'رفتن به یک سال',
    collection: 'مجموعه‌ی بازی‌ها',
    no: (i, n) => `شماره‌ی ${i} از ${n}`,
    openHint: 'جعبه را باز کن',
    openHintVi: 'جعبه را باز کن — به وایس سیتی برو',
    releasesIn: 'زمان باقی‌مانده تا عرضه',
    unlocksIn: 'باز شدن بازی در نیمه‌شب به وقت محلی، تا',
    outNow: 'منتشر شد',
    units: ['روز', 'ساعت', 'دقیقه', 'ثانیه'],
    closeCase: 'بستن جعبه', closeWord: 'بستن',
    chapter: (i, n, era) => `فصل ${i} از ${n} · دنیای ${era}`,
    released: 'تاریخ انتشار', madeFor: 'ساخته‌شده برای', launchedOn: 'پلتفرم‌های عرضه', developer: 'سازنده', publisher: 'ناشر',
    metacritic: 'متاکریتیک', noScore: 'امتیازی ثبت نشده',
    setting: 'محل داستان', playingAs: 'شخصیت اصلی', engine: 'موتور بازی',
    productionFile: 'پرونده‌ی ساخت', productionSub: 'ساختنش چه‌قدر هزینه و زمان برد', productionSubVi: 'بزرگ‌ترین پروژه‌ی راک‌استار تا امروز',
    budget: 'بودجه', devTime: 'مدت ساخت', team: 'تیم', sales: 'تعداد فروش', preorders: 'پیش‌فروش',
    notDisclosed: 'اعلام نشده',
    remember: 'یادت هست؟',
    imagesFrom: (n, y) => `${n} تصویر از سال ${y}`,
    noteOfficial: 'جلد و تصاویر: متریال رسمی راک‌استار گیمز از سایت rockstargames.com. اطلاعات: ویکی‌پدیا (منابعش همان‌جا آمده). روی دیسک، تصویر جلد چاپ شده.',
    noteAdvance: 'راک‌استار برای این بازی صفحه‌ای ندارد؛ لوگو، صفحه‌ی شروع و عکس کارتریج از ویکی‌پدیا آمده. اطلاعات: ویکی‌پدیا.',
    openShot: (i, t) => `باز کردن تصویر ${i} از ${t}`,
    viEyebrow: 'ستاره‌ی مجموعه · بدون دیسک فیزیکی',
    viTitle: 'وایس سیتی، آمریکا.',
    viCite: ' — راک‌استار گیمز (ترجمه)',
    platforms: 'پلتفرم‌ها', release: 'انتشار',
    viStorySrc: 'برگرفته از خلاصه‌ی داستان رسمی راک‌استار.',
    launchGallery: 'گالری عرضه',
    officialShots: (n) => `${n} تصویر رسمی`,
    officialScreens: 'تصاویر رسمی',
    watch: (l) => `تماشای ${l}`, onRockstar: ' در rockstargames.com ↗',
    viCredit: 'همه‌ی تصاویر GTA VI متریال رسمی راک‌استار گیمز هستند و مستقیم از rockstargames.com/VI بارگذاری می‌شوند. این یک مجموعه‌ی شخصیِ طرفداری است و هیچ وابستگی یا تأییدی از طرف راک‌استار گیمز یا تیک‌تو اینتراکتیو ندارد.',
    nextChapter: '★ فصل بعدی',
    lbClose: 'بستن', lbPrev: 'تصویر قبلی', lbNext: 'تصویر بعدی', lbOfficial: 'رسمی · © راک‌استار گیمز',
    aboutTitle: 'درباره‌ی این قفسه',
    aboutBody: [
      'همه‌ی نسخه‌های Grand Theft Auto، از نسخه‌ی اول ۱۹۹۷ تا GTA VI، روی یک قفسه. هر بازی در جعبه‌ی همان کنسولی است که برایش ساخته شد. یکی را بیرون بکش، بازش کن و به گذشته برگرد.',
      'اطلاعات — تاریخ انتشار، استودیو، بودجه، مدت ساخت، اندازه‌ی تیم، فروش و امتیاز متاکریتیک — از مقاله‌ی ویکی‌پدیای هر بازی و منابع آن آمده. اگر عددی هیچ‌وقت رسماً اعلام نشده، به‌جای حدس زدن نوشته‌ایم «اعلام نشده».',
      'جلدها و تصاویر، متریال رسمی راک‌استار گیمز از rockstargames.com هستند (GTA Advance: ویکی‌پدیا). روی دیسک‌ها تصویر جلد چاپ شده.',
    ],
    aboutLegal: 'پروژه‌ی طرفداری. بدون وابستگی یا تأیید از طرف راک‌استار گیمز، تیک‌تو اینتراکتیو، سونی، مایکروسافت یا نینتندو. حق همه‌ی تصاویر برای صاحبانشان محفوظ است.',
  },
};

// Small drawn flags: emoji flags sit at different heights on each system, and Windows shows letters instead.
export const FLAGS = {
  fa: '<svg viewBox="0 0 21 15"><rect width="21" height="5" fill="#239f40"/><rect y="5" width="21" height="5" fill="#fff"/><rect y="10" width="21" height="5" fill="#da0000"/><path d="M10.5 6.1c-.9.3-1.3 1-1.3 1.5 0 .6.5 1.2 1.3 1.4.8-.2 1.3-.8 1.3-1.4 0-.5-.4-1.2-1.3-1.5Z" fill="none" stroke="#da0000" stroke-width=".55"/><path d="M10.5 6.4v2.4" stroke="#da0000" stroke-width=".55"/></svg>',
  en: '<svg viewBox="0 0 21 15"><rect width="21" height="15" fill="#fff"/><g fill="#b22234"><rect width="21" height="1.154"/><rect y="2.308" width="21" height="1.154"/><rect y="4.615" width="21" height="1.154"/><rect y="6.923" width="21" height="1.154"/><rect y="9.231" width="21" height="1.154"/><rect y="11.538" width="21" height="1.154"/><rect y="13.846" width="21" height="1.154"/></g><rect width="9" height="8.077" fill="#3c3b6e"/></svg>',
};

let lang = new URLSearchParams(location.search).get('lang') === 'fa' ? 'fa' : 'en';
export const getLang = () => lang;
export const isFa = () => lang === 'fa';
export const T = () => LANGS[lang];

/** Persian digits in Persian; leaves Latin text untouched. */
export function digits(v) {
  const s = String(v);
  return lang === 'fa' ? s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : s;
}

export function setLang(next) {
  lang = next;
  const t = T();
  document.documentElement.lang = next;
  document.documentElement.dir = t.dir;
  document.title = t.title;
  const url = new URL(location.href);
  if (next === 'en') url.searchParams.delete('lang');
  else url.searchParams.set('lang', next);
  history.replaceState(null, '', url);
}
