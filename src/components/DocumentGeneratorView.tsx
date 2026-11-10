import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Copy,
  Download,
  Check,
  RefreshCw,
  Scale,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../types/legal';
import { generateLegalDocument } from '../services/apiService';

interface DocumentGeneratorViewProps {
  language: Language;
}

interface TemplatePreset {
  id: string;
  title: string;
  icon: string;
  group: 'oila' | 'mehnat' | 'jinoyat' | 'mamuriy' | 'fuqarolik';
  courtOrOrg: { uz: string; rf: string };
  claimant: { uz: string; rf: string };
  defendant: { uz: string; rf: string };
  facts: { uz: string; rf: string };
  claims: { uz: string; rf: string };
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'davo_aliment',
    title: 'Aliment undirish da\'vosi',
    icon: '👶',
    group: 'oila',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha Shayxontohur tumanlararo sudiga',
      rf: 'В судебный участок мирового судьи г. Москвы',
    },
    claimant: {
      uz: 'Aliyeva Nargiza Shuhratovna (Toshkent sh., Shayxontohur t., Guliston ko\'chasi, 25-uy)',
      rf: 'Иванова Анна Сергеевна (г. Москва, ул. Тверская, д. 10, кв. 14)',
    },
    defendant: {
      uz: 'Aliyev Rustam Akramovich (Toshkent sh., Chilonzor t., Qatortol ko\'chasi, 12-uy)',
      rf: 'Иванов Сергей Викторович (г. Москва, Ленинградский пр-т, д. 22, кв. 5)',
    },
    facts: {
      uz: 'Da\'vogar va javobgar o\'rtasida 2018-yil 12-mayda qonuniy nikoh tuzilgan. Birgalikdagi turmushimizdan 2020-yilda tug\'ilgan voyaga yetmagan farzandimiz bor. Hozirda birga yashamaymiz, javobgar bolaning moddiy ta\'minotida umuman qatnashmayapti, ixtiyoriy ravishda moddiy yordam berishdan bosh tortmoqda.',
      rf: 'Истец и ответчик состоят в браке с 2018 года. Имеют общего несовершеннолетнего ребенка 2020 года рождения. Ответчик материальной помощи на содержание ребенка добровольно не оказывает.',
    },
    claims: {
      uz: '1. Javobgar Aliyev Rustam Akramovichdan voyaga yetmagan farzandimiz ta\'minoti uchun har oylik ish haqi va barcha daromadlarining 1/4 qismi miqdorida aliment undirish.\n2. Hal qiluv qarorining aliment undirish qismini darhol ijro etilishini ta\'minlash.',
      rf: '1. Взыскать с ответчика в пользу истца алименты на содержание ребенка в размере 1/4 доли всех видов заработка ежемесячно.\n2. Обратить решение к немедленному исполнению.',
    },
  },
  {
    id: 'davo_ajrim',
    title: 'Nikohdan ajratish da\'vosi',
    icon: '💍',
    group: 'oila',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha Mirzo Ulug‘bek tumanlararo sudiga',
      rf: 'В районный суд города Москвы',
    },
    claimant: {
      uz: 'Karimova Ziyoda Baxtiyorovna (Toshkent sh., Mirzo Ulug‘bek t., Buyuk Ipak Yo‘li ko‘chasi, 44-uy)',
      rf: 'Смирнова Елена Дмитриевна (г. Москва, ул. Арбат, д. 15, кв. 8)',
    },
    defendant: {
      uz: 'Karimov Sardor Olimovich (Toshkent sh., Mirzo Ulug‘bek t., Feruza mavzesi, 12-uy)',
      rf: 'Смирнов Дмитрий Андреевич (г. Москва, ул. Профсоюзная, д. 50, кв. 11)',
    },
    facts: {
      uz: 'Taraflar 2019-yildan buyon qonuniy nikohda. Oila qurilganidan buyon xarakterlar to\'g\'ri kelmasligi, o\'zaro ishonchsizlik va doimiy kelishmovchiliklar sababli birgalikdagi turmush 2023-yil sentyabrdan to\'xtagan. Yarashish komissiyasi suhbatlari natija bermadi. Oilani qayta tiklashning imkoni yo\'q.',
      rf: 'Стороны состоят в зарегистрированном браке с 2019 года. Совместная жизнь и брачные отношения прекращены с 2023 года из-за непримиримых разногласий. Сохранение семьи невозможно.',
    },
    claims: {
      uz: '1. Da\'vogar va javobgar o\'rtasida 2019-yil 15-aprelda FHDYo bo\'limida qayd etilgan nikohni bekor qilish.\n2. Sud xarajatlarini javobgar hisobiga yuklash.',
      rf: '1. Расторгнуть брак между истцом и ответчиком, зарегистрированный органом ЗАГС в 2019 году.',
    },
  },
  {
    id: 'davo_qarz',
    title: 'Qarz va foizlarni undirish',
    icon: '💰',
    group: 'fuqarolik',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha Yakkasaroy tumanlararo sudiga',
      rf: 'В Пресненский районный суд города Москвы',
    },
    claimant: {
      uz: 'Sobirov Jamshid Alisherovich (Toshkent sh., Yakkasaroy t., Shota Rustaveli ko‘chasi, 32-uy)',
      rf: 'Ковалев Максим Игоревич (г. Москва, ул. Красная Пресня, д. 9)',
    },
    defendant: {
      uz: 'Tursunov Bobur Tohirovich (Toshkent sh., Yakkasaroy t., Bobur ko‘chasi, 55-uy)',
      rf: 'Петров Роман Васильевич (г. Москва, ул. 1905 года, д. 14)',
    },
    facts: {
      uz: '2023-yil 15-mart kuni da\'vogar javobgarga tilxat (raspiyska) asosida 60 000 000 (oltmish million) so\'m miqdorida qarz bergan. Tilxatga ko\'ra, javobgar qarzni 2023-yil 1-dekabrga qadar to\'liq qaytarishi shart edi. Ammo javobgar muddat o\'tgan bo\'lsa-da qarzni to\'lamadi, yuborilgan talabnomani javobsiz qoldirdi.',
      rf: '15 марта 2023 г. истец передал ответчику по расписке денежные средства в сумме 500 000 рублей со сроком возврата до 01 декабря 2023 г. Обязательство по возврату ответчиком нарушено, претензия оставлена без удовлетворения.',
    },
    claims: {
      uz: '1. Javobgar Tursunov Bobur Tohirovichdan 60 000 000 so\'m asosiy qarz summasini undirish.\n2. FK 327-moddasi tartibida kechiktirilgan muddat uchun 5 400 000 so\'m foiz undirish.\n3. Davlat boji va vakillik xarajatlarini javobgardan undirish.',
      rf: '1. Взыскать с ответчика сумму основного долга в размере 500 000 руб.\n2. Взыскать проценты за пользование чужими денежными средствами по ст. 395 ГК РФ.\n3. Взыскать госпошлину.',
    },
  },
  {
    id: 'davo_ishga_tiklash',
    title: 'Ishga tiklash va majburiy progul',
    icon: '👔',
    group: 'mehnat',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha Shayxontohur tumanlararo sudiga',
      rf: 'В Тверской районный суд города Москвы',
    },
    claimant: {
      uz: 'Rustamov Jamshid Anvarovich (Toshkent sh., Shayxontohur t., Navoiy ko\'chasi, 14-uy)',
      rf: 'Сидоров Олег Николаевич (г. Москва, ул. Тверская, д. 4)',
    },
    defendant: {
      uz: '"InnoTech Solutions" MChJ (Toshkent sh., Yunusobod t., Amir Temur ko\'chasi, 82-uy)',
      rf: 'ООО «Технологии Инноваций» (г. Москва, Ленинградский пр-т, д. 39)',
    },
    facts: {
      uz: 'Da\'vogar 2022-yildan buyon javobgar korxonada bosh mutaxassis lavozimida ishlab kelgan. 2024-yil 10-yanvarda xodim kasallik ta\'tilida bo\'lgan paytda ish beruvchining tashabbusi bilan asossiz ravishda ishdan bo\'shatilgan. Kasaba uyushmasi roziligi olinmagan, MK 161 va 163-moddalari qo\'pol ravishda buzilgan.',
      rf: 'Истец работал в организации в должности главного специалиста. Был незаконно уволен по инициативе работодателя в период временной нетрудоспособности (на больничном), что грубо нарушает ст. 81 ТК РФ.',
    },
    claims: {
      uz: '1. Ish beruvchining ishdan bo\'shatish to\'g\'risidagi buyrug\'ini bekor qilish va avvalgi lavozimga ishga tiklash.\n2. Majburiy progul vaqti uchun 3 oylik ish haqi (24 mln so\'m) undirish.\n3. MK 563 va FK 1021-moddalari asosida 10 mln so\'m ma\'naviy zarar kompensatsiyasi undirish.',
      rf: '1. Признать увольнение незаконным и восстановить истца на работе в прежней должности.\n2. Взыскать средний заработок за время вынужденного прогула.\n3. Взыскать компенсацию морального вреда (ст. 237 ТК РФ).',
    },
  },
  {
    id: 'davo_zarar',
    title: 'Yetkazilgan zararni qoplash (YTH)',
    icon: '🚗',
    group: 'fuqarolik',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha Chilonzor tumanlararo sudiga',
      rf: 'В Черемушкинский районный суд города Москвы',
    },
    claimant: {
      uz: 'Xoliqov Temur Mahmudovich (Toshkent sh., Chilonzor t., Cho‘ponota ko‘chasi, 8-uy)',
      rf: 'Николаев Игорь Сергеевич (г. Москва, ул. Профсоюзная, д. 88)',
    },
    defendant: {
      uz: 'Bekzodov Anvar Ilhomovich (Toshkent sh., Uchtepa t., Lutfiy ko‘chasi, 19-uy)',
      rf: 'Васильев Артем Юрьевич (г. Москва, ул. Гарибальди, д. 12)',
    },
    facts: {
      uz: '2024-yil 2-fevralda sodir bo\'lgan YTH natijasida javobgarning yo\'l harakati qoidalarini buzishi sababli da\'vogarga tegishli avtotransport vositasiga jiddiy zarar yetkazilgan. YPX xulosasiga ko\'ra to\'liq javobgar aybdor deb topilgan. Mustaqil ekspertiza xulosasiga asosan tiklash xarajatlari 28 500 000 so\'mni tashkil etdi.',
      rf: 'В результате ДТП, произошедшего по вине ответчика, автомобилю истца причинен значительный материальный ущерб. По данным независимой экспертизы стоимость восстановительного ремонта составила 340 000 рублей.',
    },
    claims: {
      uz: '1. Javobgardan 28 500 000 so\'m yetkazilgan moddiy zararni undirish.\n2. 5 000 000 so\'m ma\'naviy zarar kompensatsiyasi undirish.\n3. Mustaqil ekspertiza xarajatlari (1 200 000 so\'m) va davlat bojini undirish.',
      rf: '1. Взыскать с ответчика сумму ущерба 340 000 руб.\n2. Взыскать расходы на экспертизу и судебные издержки.',
    },
  },
  {
    id: 'davo_snos',
    title: 'Snos va Mulk kompensatsiyasi',
    icon: '🏚️',
    group: 'fuqarolik',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha tumanlararo sudiga',
      rf: 'В районный суд города Москвы',
    },
    claimant: {
      uz: 'Murodov Akmal Vohidovich (Toshkent sh., Shayxontohur t., Guliston ko‘chasi, 10-uy mulkdori)',
      rf: 'Кузнецов Валерий Михайлович (г. Москва, ул. Садовая, д. 5)',
    },
    defendant: {
      uz: 'Tuman hokimligi va Quruvchi (Developer) korxonasi',
      rf: 'Департамент городского имущества г. Москвы',
    },
    facts: {
      uz: 'Da\'vogarga mulk huquqi asosida tegishli bo\'lgan xususiy turar joy davlat va jamoat ehtiyojlari uchun buzilishga (\'snos\') tushgan. Ammo Konstitutsiya 47-moddasi va VMQ 911-sonli qarori talablariga zid holda, mulkdorga bozor bahosidagi tovon puli oldindan to\'liq to\'lab berilmasdan, uyni buzish choralari boshlab yuborilgan.',
      rf: 'Жилое помещение истца изымается для муниципальных нужд. В нарушение требований закона предварительное и равноценное возмещение по рыночной стоимости истцу не предоставлено.',
    },
    claims: {
      uz: '1. Mustaqil baholash hisobotiga asosan 1 250 000 000 so\'m kompensatsiya tovon pulini javobgarlardan undirish.\n2. Tovon puli to\'liq to\'lanmagunga qadar mulkni buzish yoki boshqa shaxslarga berishni taqiqlash.',
      rf: '1. Обязать предоставить предварительное равноценное возмещение стоимости изымаемого жилья в полном объеме.\n2. Приостановить снос до выплаты компенсации.',
    },
  },
  {
    id: 'davo_propiska',
    title: 'Propiskadan chiqarish da\'vosi',
    icon: '🚪',
    group: 'fuqarolik',
    courtOrOrg: {
      uz: 'Fuqarolik ishlari bo‘yicha tumanlararo sudiga',
      rf: 'В районный суд города Москвы',
    },
    claimant: {
      uz: 'G‘aniyev Dilshod Rahimovich (Uy-joyning yagona mulkdori)',
      rf: 'Морозов Андрей Викторович (Собственник квартиры)',
    },
    defendant: {
      uz: 'G‘aniyev Mansur Rahimovich',
      rf: 'Морозов Кирилл Викторович',
    },
    facts: {
      uz: 'Da\'vogar uy-joyning yakka-yu yagona qonuniy mulkdori hisoblanadi. Javobgar ushbu uyda doimiy ro\'yxatda turadi, lekin 2021-yildan buyon (3 yildan ortiq) boshqa manzilda yashaydi, oilaviy munosabatlar uzilgan, uyning kommunal xarajatlarida qatnashmaydi, shaxsiy buyumlari ham yo\'q.',
      rf: 'Ответчик зарегистрирован в принадлежащей истцу квартире, однако более 3 лет в ней не проживает, вещей не хранит, бремя содержания жилья не несет. Членом семьи истца не является.',
    },
    claims: {
      uz: '1. O\'zbekiston Respublikasi Uy-joy kodeksining 52-moddasi asosida javobgarni turar joydan foydalanish huquqini yo\'qotgan deb topish va doimiy ro\'yxatdan (propiskadan) chiqarish.',
      rf: '1. Признать ответчика утратившим право пользования жилым помещением и снять с регистрационного учета по месту жительства.',
    },
  },
  {
    id: 'iltimosnoma_95',
    title: 'JPK 95: Nomaqbul dalil iltimosnomasi',
    icon: '⚖️',
    group: 'jinoyat',
    courtOrOrg: {
      uz: 'Jinoyat ishlari bo‘yicha Shayxontohur tuman sudiga',
      rf: 'В Тверской районный суд города Москвы',
    },
    claimant: {
      uz: 'Advokat Xurramov D.A. (Gumon qilinuvchi / Ayblanuvchi Sh.A. himoyachisi)',
      rf: 'Адвокат Петров А.В. в защиту обвиняемого Смирнова И.К.',
    },
    defendant: {
      uz: 'Tergov organi / Prokuratura',
      rf: 'Следственный отдел Следственного комитета РФ',
    },
    facts: {
      uz: 'Dastlabki tergov davrida himoya ostidagi shaxs 2024-yil 12-fevralda ushlangan. Shaxs advokat yordamini talab qilgan bo\'lsa-da, JPK 51-moddasi talablariga zid tarzda himoyachi ta\'minlanmagan holda so\'roq qilingan, shuningdek tergov harakati videoyozuvsiz o\'tkazilgan.',
      rf: 'При задержании подзащитного 12 февраля 2024 г. следствием было грубо нарушено право на защиту: допрос произведен без участия защитника, несмотря на заявленное ходатайство (ст. 51 УПК РФ), видеозапись не производилась.',
    },
    claims: {
      uz: '1. O\'zbekiston Respublikasi Konstitutsiyasining 29-moddasi 4-qismi va JPK 95-moddasi asosida 2024-yil 12-fevraldagi so\'roq bayonnomasini nomaqbul (yaroqsiz) dalil deb topish va ayblov asosidan so\'zsiz chiqarish.',
      rf: '1. На основании ч. 2 ст. 50 Конституции РФ и ст. 75, 235 УПК РФ признать протокол допроса от 12.02.2024 недопустимым доказательством и исключить его из материалов дела.',
    },
  },
  {
    id: 'iltimosnoma_garov',
    title: 'Qamoqni Garov / Uy qamog\'iga o\'zgartirish',
    icon: '🛡️',
    group: 'jinoyat',
    courtOrOrg: {
      uz: 'Jinoyat ishlari bo‘yicha sudga',
      rf: 'В Басманный районный суд города Москвы',
    },
    claimant: {
      uz: 'Advokat Yo‘ldoshev B.Q. (Ayblanuvchi manfaatlarini himoya qilib)',
      rf: 'Адвокат Семенов К.М. в интересах обвиняемого',
    },
    defendant: {
      uz: 'Ayblov organi / Tergovchi',
      rf: 'Орган предварительного следствия',
    },
    facts: {
      uz: 'Himoyamdagi shaxsga nisbatan qamoqqa olish ehtiyot chorasi so\'ralmoqda. Shaxs muqaddam sudlanmagan, doimiy yashash joyi bor, oilali, qaramog\'ida ikki nafar voyaga yetmagan farzandi bor, tergovdan yashirinish niyati yo\'q. Yaqinlari sud depozitiga 120 000 000 so\'m garov puli kiritishga tayyor.',
      rf: 'В отношении подзащитного заявлено ходатайство об аресте. Обвиняемый ранее не судим, имеет постоянное место жительства и семью, на иждивении двое малолетних детей. Родственники готовы внести залог в размере 1 000 000 рублей.',
    },
    claims: {
      uz: '1. JPK 242 va 249-moddalariga muvofiq qamoqqa olish iltimosnomasini rad etish va unga nisbatan Garov yoki Uy qamog\'i ehtiyot chorasini qo\'llash.',
      rf: '1. Отказать в удовлетворении ходатайства следователя о заключении под стражу.\n2. Избрать меру пресечения в виде залога или домашнего ареста (ст. 106, 107 УПК РФ).',
    },
  },
  {
    id: 'shikoyat_hokim',
    title: 'Hokim qarorini bekor qilish (MSPIK 27)',
    icon: '🏛️',
    group: 'mamuriy',
    courtOrOrg: {
      uz: 'Toshkent tumanlararo Ma\'muriy sudiga',
      rf: 'В районный суд города Москвы (в порядке КАС РФ)',
    },
    claimant: {
      uz: '\'Agro Logistics\' MChJ direktori Xasanov O.K.',
      rf: 'ООО «Агрологистика» в лице генерального директора',
    },
    defendant: {
      uz: 'Tuman hokimligi va Tuman hokimi',
      rf: 'Префектура административного округа г. Москвы',
    },
    facts: {
      uz: 'Tuman hokimining 2024-yil 15-yanvardagi qarori bilan arizachiga qonuniy berilgan yer uchastkasi asossiz, suddan tashqari tartibda va ogohlantirishsiz zaxiraga qaytarilgan. Ushbu qaror Yer kodeksi 36-moddasi va \'Ma\'muriy tartib-taomillar to\'g\'risida\'gi qonunga mutlaqo ziddir.',
      rf: 'Постановлением органа исполнительной власти незаконно прекращено право пользования земельным участком заявителя без соблюдения установленной законом судебной процедуры.',
    },
    claims: {
      uz: '1. O\'zbekiston Respublikasi MSPIK 27-bobi va 185-moddasi tartibida Tuman hokimining 2024-yil 15-yanvardagi qarorini haqiqiy emas deb topish va bekor qilish.',
      rf: '1. Признать незаконным и отменить ненормативный правовой акт органа власти в порядке Кодекса административного судопроизводства РФ.',
    },
  },
  {
    id: 'advokat_sorovi',
    title: 'Advokat so\'rovi (Ma\'lumot olish)',
    icon: '📋',
    group: 'jinoyat',
    courtOrOrg: {
      uz: 'O‘zbekiston Respublikasi Davlat kadastrlari palatasiga',
      rf: 'В Федеральную службу государственной регистрации (Росреестр)',
    },
    claimant: {
      uz: 'Advokat Xoliqov A.B. (Advokatlik guvohnomasi № 1420, Order № 88)',
      rf: 'Адвокат Воронов С.П. (Реестровый номер 77/14589, Ордер № 102)',
    },
    defendant: {
      uz: 'Fuqaro N.ga malakali yuridik yordam ko\'rsatish doirasida',
      rf: 'В связи с оказанием юридической помощи доверителю',
    },
    facts: {
      uz: 'Fuqaro N.ga malakali advokatlik yordami ko\'rsatish to\'g\'risidagi shartnoma va berilgan orderga binoan, sudga mulkiy nizo bo\'yicha da\'vo arizasi kiritish uchun rasmiy hujjatlar zarur.',
      rf: 'В рамках соглашения об оказании юридической помощи по гражданскому делу требуется истребование официальных сведений и архивных документов.',
    },
    claims: {
      uz: '1. \'Advokatura to\'g\'risida\'gi Qonunning 6-moddasi tartibida ko\'chmas mulk obyektining kadastr yig\'majildi va egalik huquqi tarixini 15 kun ichida taqdim etishingizni so\'rayman.',
      rf: '1. На основании ст. 6.1 ФЗ № 63-ФЗ «Об адвокатской деятельности» прошу в 30-дневный срок предоставить выписку и регистрационные сведения.',
    },
  },
  {
    id: 'apellyatsiya_hukm',
    title: 'Sud hukmi ustidan Apellyatsiya shikoyati',
    icon: '📑',
    group: 'jinoyat',
    courtOrOrg: {
      uz: 'Toshkent shahar sudi Jinoyat ishlari bo‘yicha sudlov hay’atiga',
      rf: 'В судебную коллегию по уголовным делам Мосгорсуда',
    },
    claimant: {
      uz: 'Mahkum A.ning himoyachisi — advokat Samadov E.R.',
      rf: 'Адвокат Михайлов В.А. в защиту осужденного',
    },
    defendant: {
      uz: '1-instansiya sudining 2024-yil 5-martdagi hukmi yuzasidan',
      rf: 'На приговор районного суда от 05 марта 2024 г.',
    },
    facts: {
      uz: 'Birinchi instansiya sudi himoya tomonining oqlovchi asosiy dalillariga huquqiy baho bermasdan, tergovda yo\'l qo\'yilgan protsessual qonunbuzarliklarni inobatga olmasdan, yetarli dalillar bo\'lmagan holda nohaq ayblov hukmi chiqargan.',
      rf: 'Судом первой инстанции допущены существенные нарушения уголовно-процессуального закона, выводы суда не соответствуют фактическим обстоятельствам дела, не дана оценка доказательствам защиты.',
    },
    claims: {
      uz: '1. Sud hukmini bekor qilish va O\'zbekiston Respublikasi JPK 83-moddasi 2-bandiga asosan aybsiz deb topib, oqlov hukmi chiqarish.',
      rf: '1. Приговор суда первой инстанции отменить и постановить в отношении подзащитного оправдательный приговор.',
    },
  },
];

export const DocumentGeneratorView: React.FC<DocumentGeneratorViewProps> = ({
  language,
}) => {
  const [jurisdiction, setJurisdiction] = useState<'uz' | 'rf'>('uz');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [docCategory, setDocCategory] = useState('davo_aliment');

  const [courtOrOrg, setCourtOrOrg] = useState(
    TEMPLATE_PRESETS[0].courtOrOrg.uz
  );
  const [claimant, setClaimant] = useState(TEMPLATE_PRESETS[0].claimant.uz);
  const [defendant, setDefendant] = useState(TEMPLATE_PRESETS[0].defendant.uz);
  const [facts, setFacts] = useState(TEMPLATE_PRESETS[0].facts.uz);
  const [claims, setClaims] = useState(TEMPLATE_PRESETS[0].claims.uz);

  const [loading, setLoading] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const applyPreset = (preset: TemplatePreset, jur: 'uz' | 'rf' = jurisdiction) => {
    setDocCategory(preset.id);
    setCourtOrOrg(jur === 'rf' ? preset.courtOrOrg.rf : preset.courtOrOrg.uz);
    setClaimant(jur === 'rf' ? preset.claimant.rf : preset.claimant.uz);
    setDefendant(jur === 'rf' ? preset.defendant.rf : preset.defendant.uz);
    setFacts(jur === 'rf' ? preset.facts.rf : preset.facts.uz);
    setClaims(jur === 'rf' ? preset.claims.rf : preset.claims.uz);
  };

  const handleJurisdictionChange = (jur: 'uz' | 'rf') => {
    setJurisdiction(jur);
    const current = TEMPLATE_PRESETS.find((p) => p.id === docCategory) || TEMPLATE_PRESETS[0];
    applyPreset(current, jur);
  };

  const handlePresetSelect = (presetId: string) => {
    const selected = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (selected) {
      applyPreset(selected, jurisdiction);
    }
  };

  const filteredPresets =
    activeGroup === 'all'
      ? TEMPLATE_PRESETS
      : TEMPLATE_PRESETS.filter((p) => p.group === activeGroup);

  const handleGenerate = async () => {
    if (!facts.trim()) return;
    setLoading(true);
    setGeneratedDoc(null);

    try {
      const data = await generateLegalDocument({
        docCategory,
        courtOrOrg,
        parties: { claimant, defendant },
        facts,
        claims,
        language,
        jurisdiction,
      });
      setGeneratedDoc(data.documentContent);
    } catch (err: any) {
      setGeneratedDoc(`Xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HUQUQ_AI_${docCategory}_${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Rasmiy Huquqiy Hujjat - HUQUQ AI</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; font-size: 14pt; line-height: 1.5; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${generatedDoc}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>RASMIY PROTSESSUAL HUJJATLAR KONSTRUKTORI (FPK, JPK, IPK, MSPIK)</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              AI Legal Document Generator: Sud Hujjatlari Shablonlari
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Aliment, ajrim, qarz undirish, ishga tiklash, snos, JPK 95 nomaqbul dalillar va advokat so‘rovlarini O‘zbekiston qonunlari standartida tuzing.
            </p>
          </div>
        </div>
      </div>

      {/* Template Quick Selection Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              Tayyor Shablonlar ({TEMPLATE_PRESETS.length} ta):
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'oila', label: '👶 Oila' },
              { id: 'fuqarolik', label: '💰 Fuqarolik va Qarz' },
              { id: 'mehnat', label: '👔 Mehnat' },
              { id: 'jinoyat', label: '⚖️ Jinoyat & JPK 95' },
              { id: 'mamuriy', label: '🏛️ Ma\'muriy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGroup(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeGroup === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
          {filteredPresets.map((preset) => {
            const isSelected = docCategory === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-2.5 rounded-xl text-left transition-all border flex items-start space-x-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="text-lg leading-none mt-0.5">{preset.icon}</span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {preset.group === 'oila'
                      ? 'Oila kodeksi'
                      : preset.group === 'fuqarolik'
                      ? 'Fuqarolik (FK)'
                      : preset.group === 'mehnat'
                      ? 'Mehnat kodeksi'
                      : preset.group === 'jinoyat'
                      ? 'JPK / Advokatura'
                      : 'MSPIK'}
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4 shadow-lg">
            {/* Jurisdiction Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Yurisdiksiya va Qonunchilik Standarti:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleJurisdictionChange('uz')}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    jurisdiction === 'uz'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🇺🇿 O‘zbekiston (FPK/JPK)
                </button>
                <button
                  type="button"
                  onClick={() => handleJurisdictionChange('rf')}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    jurisdiction === 'rf'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🇷🇺 Rossiya (ГПК/УПК РФ)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tanlangan Hujjat Shabloni:
              </label>
              <select
                value={docCategory}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {TEMPLATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Qaysi Sud / Idora / Tashkilotga:
              </label>
              <input
                type="text"
                value={courtOrOrg}
                onChange={(e) => setCourtOrOrg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Murojaatchi (Da'vogar / Advokat / Ayblanuvchi):
                </label>
                <input
                  type="text"
                  value={claimant}
                  onChange={(e) => setClaimant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Javobgar / Qarshi Taraf / Organ:
                </label>
                <input
                  type="text"
                  value={defendant}
                  onChange={(e) => setDefendant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ishning Haqiqiy Holatlari (Faktlar):
              </label>
              <textarea
                rows={4}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Talablar va Sudga Iltimos:
              </label>
              <textarea
                rows={3}
                value={claims}
                onChange={(e) => setClaims(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !facts.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Protsessual hujjat shakllantirilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Rasmiy Hujjat Loyihasini Yaratish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Document */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col h-full min-h-[550px]">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Tayyorlangan Hujjat Matni
                </h3>
              </div>

              {generatedDoc && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 cursor-pointer"
                    title="Nusxa olish"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Nusxa olindi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nusxa olish</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 cursor-pointer"
                    title="Yuklab olish (.doc)"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Word (.doc)</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 cursor-pointer"
                    title="Chop etish"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chop etish</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 mt-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                  <p className="text-xs text-slate-400">
                    O‘zbekiston protsessual qonunchiligi asosida rasmiy hujjat tuzilmoqda...
                  </p>
                </div>
              ) : generatedDoc ? (
                <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                  {generatedDoc}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-500">
                  <FileText className="w-12 h-12 text-slate-700" />
                  <p className="text-sm font-medium text-slate-400">
                    Hali hech qanday hujjat yaratilmadi
                  </p>
                  <p className="text-xs max-w-sm text-slate-500">
                    Yuqoridagi shablonlardan birini tanlang yoki o‘z ma’lumotlaringizni kiritib, «Rasmiy Hujjat Loyihasini Yaratish» tugmasini bosing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
