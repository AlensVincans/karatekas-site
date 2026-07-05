import type { LegalPageSlug } from "./legal-service-links";
import type { Language } from "./i18n";

export type LegalBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type LegalPageContent = {
  title: string;
  description: string;
  blocks: LegalBlock[];
};

export const legalServiceTitles: Record<Language, Record<LegalPageSlug, string>> = {
  ru: {
    "delivery-information": "Информация о доставке",
    payments: "Оплата",
    "return-of-goods": "Возврат товара",
    "privacy-policy": "Политика конфиденциальности",
    gdpr: "GDPR",
    cookies: "Cookies",
  },
  lv: {
    "delivery-information": "Piegādes informācija",
    payments: "Apmaksa",
    "return-of-goods": "Preču atgriešana",
    "privacy-policy": "Privātuma politika",
    gdpr: "GDPR",
    cookies: "Sīkdatnes",
  },
  en: {
    "delivery-information": "Delivery Information",
    payments: "Payments",
    "return-of-goods": "Return of Goods",
    "privacy-policy": "Privacy Policy",
    gdpr: "GDPR",
    cookies: "Cookies",
  },
  et: {
    "delivery-information": "Tarneinfo",
    payments: "Maksed",
    "return-of-goods": "Kauba tagastamine",
    "privacy-policy": "Privaatsuspoliitika",
    gdpr: "GDPR",
    cookies: "Küpsised",
  },
  lt: {
    "delivery-information": "Pristatymo informacija",
    payments: "Apmokėjimas",
    "return-of-goods": "Prekių grąžinimas",
    "privacy-policy": "Privatumo politika",
    gdpr: "GDPR",
    cookies: "Slapukai",
  },
};

const localizedLegalPages: Partial<
  Record<Language, Partial<Record<LegalPageSlug, LegalPageContent>>>
> = {
  ru: {
    "delivery-information": {
      title: "Информация о доставке",
      description: "Стоимость доставки и сроки доставки заказов Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Стоимость доставки" },
        {
          type: "paragraph",
          text:
            "Стоимость доставки рассчитывается по адресу доставки и общему весу товаров. Точная стоимость показывается в корзине после выбора страны, способа доставки и пункта выдачи или курьерского адреса.",
        },
        { type: "heading", text: "Доставка товаров" },
        {
          type: "paragraph",
          text:
            "Если товара нет на складе в момент заказа, мы сообщим об этом по email. В таком случае срок доставки может измениться. Заказы доставляются через партнёрские пункты выдачи и курьерские службы.",
        },
        {
          type: "paragraph",
          text:
            "Если товар отсутствует на складе в Риге, доставка товара под заказ обычно занимает от 1 до 4 недель.",
        },
      ],
    },
    payments: {
      title: "Оплата",
      description: "Информация о заказе и оплате для клиентов Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Что нужно знать перед заказом" },
        {
          type: "list",
          items: [
            "Товары и цены на Karatekas.eu указаны для информации и оформления заказа.",
            "Стоимость доставки указывается отдельно и зависит от страны, адреса и выбранного способа доставки.",
            "Цены и ассортимент могут быть изменены без предварительного уведомления.",
            "Описание товара основано на информации производителя и может изменяться при обновлении характеристик товара.",
          ],
        },
        { type: "heading", text: "Оплата заказа" },
        {
          type: "paragraph",
          text:
            "Заказы можно оплатить картой через безопасную оплату Montonio или по счёту, если такой способ доступен вашему типу аккаунта. При оплате по счёту реквизиты, номер заказа и платёжная информация отправляются на email.",
        },
      ],
    },
    "return-of-goods": {
      title: "Возврат товара",
      description: "Право отказа и порядок возврата товаров Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Возврат товара и право отказа" },
        {
          type: "paragraph",
          text:
            "Покупатель имеет право отказаться от покупки в течение 14 дней с момента получения товара и вернуть товар продавцу в соответствии с законодательством Латвийской Республики и ЕС.",
        },
        { type: "heading", text: "Как вернуть товар" },
        {
          type: "paragraph",
          text:
            "Если товар не подходит по размеру, цвету или модели, его можно вернуть или обменять в течение 14 дней с момента получения. Товар должен быть неиспользованным и возвращён в надлежащем состоянии.",
        },
        {
          type: "paragraph",
          text:
            "Для возврата заполните форму возврата, приложите документ покупки и отправьте товар через согласованный способ доставки. Возврат через Omniva возможен на пакомат Rīgas Deglava ielas Maxima XXX, Augusta Deglava iela 67, Rīga, телефон +37125168811.",
        },
      ],
    },
    "privacy-policy": {
      title: "Политика конфиденциальности",
      description: "Как BBK AUTO, SIA обрабатывает и хранит персональные данные на Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Общие положения" },
        {
          type: "paragraph",
          text:
            "Настоящая политика описывает, как BBK AUTO, SIA, регистрационный номер 40003924244, Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, получает, обрабатывает и хранит персональные данные клиентов и посетителей сайта.",
        },
        {
          type: "paragraph",
          text:
            "Персональные данные - это любая информация об идентифицированном или идентифицируемом физическом лице. Обработка включает сбор, запись, хранение, использование, просмотр, удаление и другие операции с данными.",
        },
        { type: "heading", text: "Какие данные мы обрабатываем" },
        {
          type: "list",
          items: [
            "Имя и фамилия;",
            "Контактные данные, включая email и телефон;",
            "Данные заказа: товары, адрес доставки, цена, способ оплаты и история платежей;",
            "Информация, которую вы предоставляете при использовании сайта или обращении к нам.",
          ],
        },
        { type: "heading", text: "Правовое основание и срок хранения" },
        {
          type: "paragraph",
          text:
            "Данные обрабатываются на основании согласия, исполнения договора, юридической обязанности и законного интереса в соответствии с GDPR. Данные хранятся только столько, сколько необходимо для цели обработки, выполнения закона, защиты законных интересов или пока действует согласие.",
        },
        { type: "heading", text: "Ваши права" },
        {
          type: "paragraph",
          text:
            "Вы имеете право запросить доступ к данным, исправление, удаление, ограничение обработки, переносимость данных, отзыв согласия и подачу жалобы в надзорный орган. Для запроса напишите на info@karatekas.eu.",
        },
      ],
    },
    gdpr: {
      title: "GDPR",
      description: "Правила обработки персональных данных физических лиц.",
      blocks: [
        { type: "heading", text: "Контролёр данных" },
        {
          type: "paragraph",
          text:
            "BBK AUTO, SIA, регистрационный номер 40003924244, юридический адрес Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, является контролёром данных и выполняет требования Общего регламента ЕС по защите данных 2016/679.",
        },
        { type: "heading", text: "Цели обработки" },
        {
          type: "paragraph",
          text:
            "Данные обрабатываются для администрирования отношений с клиентами, оформления заказов, выставления счетов, обеспечения оплаты, доставки и реализации законных интересов компании с соблюдением прав субъекта данных.",
        },
        { type: "heading", text: "Доступ, хранение и раскрытие" },
        {
          type: "paragraph",
          text:
            "Доступ к данным имеют только сотрудники, которым данные необходимы для выполнения обязанностей. Данные защищены паролями и организационными мерами. Данные могут быть раскрыты государственным органам по законному мотивированному запросу.",
        },
        { type: "heading", text: "Права субъекта данных" },
        {
          type: "paragraph",
          text:
            "Физические лица имеют право проверять свои данные, требовать исправления, удаления или дополнения неверных данных, а также запретить использование данных для целей, не связанных с оказанием услуг.",
        },
      ],
    },
    cookies: {
      title: "Cookies",
      description: "Информация о cookies для посетителей Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Что такое cookie?" },
        {
          type: "paragraph",
          text:
            "Cookie - это небольшой текстовый файл, который сайт сохраняет на вашем компьютере или мобильном устройстве. Cookie помогает сайту запоминать настройки, улучшать удобство использования и распознавать браузер при повторных визитах.",
        },
        { type: "heading", text: "Как мы используем cookies" },
        {
          type: "list",
          items: [
            "чтобы помнить, согласились ли вы с использованием cookies;",
            "для YouTube, Vimeo и Google Maps, если на странице есть такие элементы;",
            "для Google Analytics, чтобы улучшать качество контента и адаптировать сайт под потребности пользователей.",
          ],
        },
        { type: "heading", text: "Как отключить cookies" },
        {
          type: "paragraph",
          text:
            "Вы можете удалить cookies или заблокировать их в настройках браузера. В таком случае некоторые функции сайта могут работать ограниченно.",
        },
      ],
    },
  },
  lv: {
    "delivery-information": {
      title: "Piegādes informācija",
      description: "Karatekas.eu pasūtījumu piegādes izmaksas un termiņi.",
      blocks: [
        { type: "heading", text: "Piegādes izmaksas" },
        { type: "paragraph", text: "Piegādes maksa tiek aprēķināta pēc piegādes adreses, izvēlētā piegādes veida un preču kopējā svara. Precīza cena tiek parādīta grozā pirms pasūtījuma apstiprināšanas." },
        { type: "heading", text: "Preču piegāde" },
        { type: "paragraph", text: "Ja pasūtīšanas brīdī kāda prece nav noliktavā, mēs par to paziņosim e-pastā. Šādā gadījumā piegādes termiņš var mainīties. Pasūtījumi tiek piegādāti ar pakomātiem, pasta punktiem vai kurjeru." },
        { type: "paragraph", text: "Ja prece nav pieejama Rīgas noliktavā, piegāde pasūtāmajai precei parasti aizņem no 1 līdz 4 nedēļām." },
      ],
    },
    payments: {
      title: "Apmaksa",
      description: "Pasūtījumu un apmaksas informācija Karatekas.eu klientiem.",
      blocks: [
        { type: "heading", text: "Kas jāzina pirms pasūtījuma" },
        { type: "list", items: ["Preces un cenas Karatekas.eu internetveikalā ir norādītas pasūtījuma noformēšanai.", "Piegādes maksa tiek norādīta atsevišķi un var atšķirties pēc piegādes valsts un veida.", "Cenas un preču piedāvājums var tikt mainīts bez iepriekšēja brīdinājuma.", "Preču apraksti balstīti uz ražotāja informāciju un var mainīties, ja ražotājs atjauno specifikāciju."] },
        { type: "heading", text: "Pasūtījumu apmaksa" },
        { type: "paragraph", text: "Pasūtījumus var apmaksāt ar karti, izmantojot drošu Montonio apmaksu, vai ar rēķinu, ja šis maksājuma veids ir pieejams jūsu konta tipam. Rēķina apmaksas informācija tiek nosūtīta uz e-pastu." },
      ],
    },
    "return-of-goods": {
      title: "Preču atgriešana",
      description: "Atteikuma tiesības un preču atgriešanas kārtība.",
      blocks: [
        { type: "heading", text: "Preču atgriešana un atteikuma tiesības" },
        { type: "paragraph", text: "Pircējam ir tiesības 14 dienu laikā no preces saņemšanas dienas izmantot atteikuma tiesības un atgriezt preci pārdevējam saskaņā ar Latvijas Republikas un ES normatīvajiem aktiem." },
        { type: "heading", text: "Atteikšanās no pirkuma" },
        { type: "paragraph", text: "Ja prece neder pēc izmēra, krāsas vai modeļa, to var atgriezt vai apmainīt 14 dienu laikā no saņemšanas. Precei jābūt nelietotai un atbilstošā stāvoklī." },
        { type: "paragraph", text: "Preci var atgriezt ar pirkuma dokumentu, izmantojot saskaņotu piegādes veidu. Omniva atgriešana iespējama uz Rīgas Deglava ielas Maxima XXX pakomātu, Augusta Deglava iela 67, Rīga, tālr. +37125168811." },
      ],
    },
    "privacy-policy": {
      title: "Privātuma politika",
      description: "Kā BBK AUTO, SIA apstrādā un glabā personas datus Karatekas.eu.",
      blocks: [
        { type: "heading", text: "Vispārīgie noteikumi" },
        { type: "paragraph", text: "Šī politika apraksta, kā BBK AUTO, SIA, reģ. Nr. 40003924244, Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, iegūst, apstrādā un glabā klientu un vietnes apmeklētāju personas datus." },
        { type: "heading", text: "Apstrādājamie dati" },
        { type: "list", items: ["Vārds un uzvārds;", "Kontaktinformācija, tai skaitā e-pasts un tālrunis;", "Darījumu dati: preces, piegādes adrese, cena un apmaksas informācija;", "Cita informācija, ko sniedzat, izmantojot vietni vai sazinoties ar mums."] },
        { type: "heading", text: "Tiesiskais pamats un glabāšana" },
        { type: "paragraph", text: "Dati tiek apstrādāti uz piekrišanas, līguma izpildes, juridiska pienākuma un leģitīmo interešu pamata saskaņā ar GDPR. Dati tiek glabāti tikai tik ilgi, cik nepieciešams apstrādes mērķim vai normatīvo aktu izpildei." },
        { type: "heading", text: "Datu subjekta tiesības" },
        { type: "paragraph", text: "Jums ir tiesības piekļūt saviem datiem, pieprasīt labošanu, dzēšanu, apstrādes ierobežošanu, datu pārnesamību, atsaukt piekrišanu un iesniegt sūdzību uzraudzības iestādei. Rakstiet uz info@karatekas.eu." },
      ],
    },
    gdpr: {
      title: "GDPR",
      description: "Fiziskās personas datu apstrādes noteikumi.",
      blocks: [
        { type: "heading", text: "Fiziskas personas datu apstrades noteikumi" },
        { type: "paragraph", text: "BBK AUTO, SIA, reg. Nr. 40003924244, juridiska adrese Riga, Ilukstes iela 103 k-3 - 29, LV-1082, ir Parzinis un izpilda Eiropas Savienibas Visparigas datu aizsardzibas regulas Nr. 2016/679 prasibas Latvija." },
        { type: "heading", text: "Datu apstrades noluki" },
        { type: "paragraph", text: "Dati tiek apstradati, lai administretu klientu attiecibas, noformetu pasutijumus, izrakstitu rekinus, nodrosinatu apmaksu un piegadi, ka ari istenotu sabiedribas likumiskas intereses." },
        { type: "heading", text: "Piekluve un izpausana" },
        { type: "paragraph", text: "Piekluve datiem ir tikai darbiniekiem, kuriem ta nepieciesama darba pienakumu veiksanai. Datus var izpaust valsts institucijam, pamatojoties uz likumigu un motivetu pieprasijumu." },
        { type: "heading", text: "Datu subjekta tiesibas" },
        { type: "paragraph", text: "Fiziskajai personai ir tiesibas parbaudit savus datus, pieprasit to labosanu, dzesanu vai papildinasanu un aizliegt datu izmantosanu ar pakalpojumu sniegsanu nesaistitiem merkiem." },
      ],
    },
    cookies: {
      title: "Sīkdatnes",
      description: "Informācija par Karatekas.eu izmantotajām sīkdatnēm.",
      blocks: [
        { type: "heading", text: "Kas ir sīkdatne?" },
        { type: "paragraph", text: "Sīkdatne ir neliels teksta fails, ko tīmekļa vietne saglabā jūsu datorā vai mobilajā ierīcē. Tā palīdz atcerēties iestatījumus, uzlabot lietošanas ērtumu un atpazīt pārlūku nākamajās apmeklējuma reizēs." },
        { type: "heading", text: "Kā mēs izmantojam sīkdatnes?" },
        { type: "list", items: ["lai atcerētos, vai esat piekritis sīkdatņu izmantošanai;", "YouTube, Vimeo un Google Maps funkcijām;", "Google Analytics, lai uzlabotu vietnes saturu un pielāgotu to lietotāju vajadzībām."] },
        { type: "heading", text: "Kā atspējot sīkdatnes?" },
        { type: "paragraph", text: "Jūs varat dzēst vai bloķēt sīkdatnes pārlūka iestatījumos. Šādā gadījumā dažas vietnes funkcijas var nedarboties pilnvērtīgi." },
      ],
    },
  },
  et: {
    "delivery-information": { title: "Tarneinfo", description: "Karatekas.eu tellimuste tarnekulud ja -ajad.", blocks: [{ type: "heading", text: "Tarnekulud" }, { type: "paragraph", text: "Tarnehind arvutatakse tarneaadressi, valitud tarneviisi ja toodete kogukaalu järgi. Täpne hind kuvatakse ostukorvis enne tellimuse kinnitamist." }, { type: "heading", text: "Toodete tarne" }, { type: "paragraph", text: "Kui mõni toode ei ole tellimise hetkel laos, teavitame sellest e-posti teel. Sellisel juhul võib tarneaeg muutuda. Tellimused tarnitakse pakiautomaatidesse, postipunktidesse või kulleriga." }, { type: "paragraph", text: "Kui toodet ei ole Riia laos, võtab ettetellitava toote tarne tavaliselt 1 kuni 4 nädalat." }] },
    payments: { title: "Maksed", description: "Karatekas.eu tellimuste ja maksete info.", blocks: [{ type: "heading", text: "Mida enne tellimist teada" }, { type: "list", items: ["Karatekas.eu veebipoes kuvatavad tooted ja hinnad on tellimuse vormistamiseks.", "Tarnekulu näidatakse eraldi ja see võib sõltuda riigist ning tarneviisist.", "Hinnad ja tootevalik võivad muutuda ette teatamata.", "Tootekirjeldused põhinevad tootja andmetel ja võivad muutuda tootja uuenduste tõttu."] }, { type: "heading", text: "Tellimuse eest tasumine" }, { type: "paragraph", text: "Tellimuse saab tasuda kaardiga turvalise Montonio makse kaudu või arve alusel, kui see makseviis on sinu konto tüübile saadaval. Arve makseinfo saadetakse e-posti aadressile." }] },
    "return-of-goods": { title: "Kauba tagastamine", description: "Taganemisõigus ja kaupade tagastamise kord.", blocks: [{ type: "heading", text: "Kauba tagastamine ja taganemisõigus" }, { type: "paragraph", text: "Ostjal on õigus 14 päeva jooksul alates kauba kättesaamisest ostust taganeda ja kaup müüjale tagastada kooskõlas Läti Vabariigi ja EL õigusaktidega." }, { type: "heading", text: "Kuidas kaup tagastada" }, { type: "paragraph", text: "Kui toode ei sobi suuruse, värvi või mudeli poolest, saab selle 14 päeva jooksul tagastada või ümber vahetada. Toode peab olema kasutamata ja sobivas seisukorras." }, { type: "paragraph", text: "Lisa ostudokument ja kasuta kokkulepitud tarneviisi. Omniva tagastus on võimalik pakiautomaati Rīgas Deglava ielas Maxima XXX, Augusta Deglava iela 67, Rīga, telefon +37125168811." }] },
    "privacy-policy": { title: "Privaatsuspoliitika", description: "Kuidas BBK AUTO, SIA töötleb ja säilitab isikuandmeid Karatekas.eu lehel.", blocks: [{ type: "heading", text: "Üldsätted" }, { type: "paragraph", text: "See poliitika kirjeldab, kuidas BBK AUTO, SIA, reg. nr 40003924244, Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, kogub, töötleb ja säilitab klientide ning veebilehe külastajate isikuandmeid." }, { type: "heading", text: "Töödeldavad andmed" }, { type: "list", items: ["Ees- ja perekonnanimi;", "Kontaktandmed, sh e-post ja telefon;", "Tellimuse andmed: tooted, tarneaadress, hind ja makseinfo;", "Muu info, mille annad veebilehte kasutades või meiega suheldes."] }, { type: "heading", text: "Õiguslik alus ja säilitamine" }, { type: "paragraph", text: "Andmeid töödeldakse nõusoleku, lepingu täitmise, juriidilise kohustuse ja õigustatud huvi alusel vastavalt GDPR-ile. Andmeid säilitatakse ainult nii kaua, kui see on vajalik töötlemise eesmärgi või seaduse täitmiseks." }, { type: "heading", text: "Andmesubjekti õigused" }, { type: "paragraph", text: "Sul on õigus taotleda juurdepääsu, parandamist, kustutamist, töötlemise piiramist, andmete ülekandmist, nõusoleku tagasivõtmist ja esitada kaebus järelevalveasutusele. Kirjuta info@karatekas.eu." }] },
    gdpr: { title: "GDPR", description: "Füüsilise isiku andmete töötlemise reeglid.", blocks: [{ type: "heading", text: "Vastutav töötleja" }, { type: "paragraph", text: "BBK AUTO, SIA, reg. nr 40003924244, aadress Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, on vastutav töötleja ja järgib EL isikuandmete kaitse üldmäärust 2016/679." }, { type: "heading", text: "Töötlemise eesmärgid" }, { type: "paragraph", text: "Andmeid töödeldakse kliendisuhete haldamiseks, tellimuste vormistamiseks, arvete väljastamiseks, maksete ja tarnete korraldamiseks ning ettevõtte õigustatud huvide kaitsmiseks." }, { type: "heading", text: "Juurdepääs ja avaldamine" }, { type: "paragraph", text: "Andmetele pääsevad ligi ainult töötajad, kellel on neid tööülesannete täitmiseks vaja. Andmeid võib avaldada ametiasutustele seadusliku ja põhjendatud taotluse alusel." }, { type: "heading", text: "Andmesubjekti õigused" }, { type: "paragraph", text: "Isikul on õigus kontrollida enda andmeid, taotleda parandamist, kustutamist või täiendamist ning keelata andmete kasutamine eesmärkidel, mis ei ole teenuse osutamisega seotud." }] },
    cookies: { title: "Küpsised", description: "Info Karatekas.eu küpsiste kohta.", blocks: [{ type: "heading", text: "Mis on küpsis?" }, { type: "paragraph", text: "Küpsis on väike tekstifail, mille veebileht salvestab sinu arvutisse või mobiilseadmesse. Küpsised aitavad meelde jätta seadeid, parandada kasutusmugavust ja tuvastada brauserit järgmistel külastustel." }, { type: "heading", text: "Kuidas küpsiseid kasutame?" }, { type: "list", items: ["et mäletada, kas oled küpsiste kasutamisega nõustunud;", "YouTube, Vimeo ja Google Maps funktsioonide jaoks;", "Google Analyticsi jaoks, et parandada sisu ja kohandada veebilehte kasutajate vajadustele."] }, { type: "heading", text: "Kuidas küpsiseid keelata?" }, { type: "paragraph", text: "Küpsiseid saab kustutada või blokeerida brauseri seadetes. Sel juhul ei pruugi mõned veebilehe funktsioonid täielikult töötada." }] },
  },
  lt: {
    "delivery-information": { title: "Pristatymo informacija", description: "Karatekas.eu užsakymų pristatymo kainos ir terminai.", blocks: [{ type: "heading", text: "Pristatymo kaina" }, { type: "paragraph", text: "Pristatymo kaina apskaičiuojama pagal pristatymo adresą, pasirinktą pristatymo būdą ir bendrą prekių svorį. Tiksli kaina rodoma krepšelyje prieš patvirtinant užsakymą." }, { type: "heading", text: "Prekių pristatymas" }, { type: "paragraph", text: "Jei užsakymo metu prekės nėra sandėlyje, apie tai informuosime el. paštu. Tokiu atveju pristatymo terminas gali keistis. Užsakymai pristatomi į paštomatus, pašto punktus arba kurjeriu." }, { type: "paragraph", text: "Jei prekės nėra Rygos sandėlyje, užsakomos prekės pristatymas paprastai trunka nuo 1 iki 4 savaičių." }] },
    payments: { title: "Apmokėjimas", description: "Karatekas.eu užsakymų ir mokėjimų informacija.", blocks: [{ type: "heading", text: "Ką reikia žinoti prieš užsakant" }, { type: "list", items: ["Karatekas.eu internetinėje parduotuvėje rodomos prekės ir kainos skirtos užsakymui pateikti.", "Pristatymo mokestis nurodomas atskirai ir gali priklausyti nuo šalies bei pristatymo būdo.", "Kainos ir prekių pasiūla gali būti keičiamos be išankstinio įspėjimo.", "Prekių aprašymai parengti pagal gamintojo informaciją ir gali keistis gamintojui atnaujinus specifikacijas."] }, { type: "heading", text: "Užsakymo apmokėjimas" }, { type: "paragraph", text: "Užsakymą galima apmokėti kortele per saugų Montonio mokėjimą arba pagal sąskaitą, jei šis mokėjimo būdas prieinamas jūsų paskyros tipui. Sąskaitos apmokėjimo informacija siunčiama el. paštu." }] },
    "return-of-goods": { title: "Prekių grąžinimas", description: "Atsisakymo teisė ir prekių grąžinimo tvarka.", blocks: [{ type: "heading", text: "Prekių grąžinimas ir atsisakymo teisė" }, { type: "paragraph", text: "Pirkėjas turi teisę per 14 dienų nuo prekės gavimo atsisakyti pirkimo ir grąžinti prekę pardavėjui pagal Latvijos Respublikos ir ES teisės aktus." }, { type: "heading", text: "Kaip grąžinti prekę" }, { type: "paragraph", text: "Jei prekė netinka pagal dydį, spalvą ar modelį, ją galima grąžinti arba pakeisti per 14 dienų nuo gavimo. Prekė turi būti nenaudota ir tinkamos būklės." }, { type: "paragraph", text: "Pridėkite pirkimo dokumentą ir naudokite suderintą pristatymo būdą. Omniva grąžinimas galimas į Rīgas Deglava ielas Maxima XXX paštomatą, Augusta Deglava iela 67, Rīga, tel. +37125168811." }] },
    "privacy-policy": { title: "Privatumo politika", description: "Kaip BBK AUTO, SIA tvarko ir saugo asmens duomenis Karatekas.eu.", blocks: [{ type: "heading", text: "Bendrosios nuostatos" }, { type: "paragraph", text: "Ši politika aprašo, kaip BBK AUTO, SIA, reg. Nr. 40003924244, Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, renka, tvarko ir saugo klientų bei svetainės lankytojų asmens duomenis." }, { type: "heading", text: "Tvarkomi duomenys" }, { type: "list", items: ["Vardas ir pavardė;", "Kontaktiniai duomenys, įskaitant el. paštą ir telefoną;", "Užsakymo duomenys: prekės, pristatymo adresas, kaina ir mokėjimo informacija;", "Kita informacija, kurią pateikiate naudodamiesi svetaine arba susisiekdami su mumis."] }, { type: "heading", text: "Teisinis pagrindas ir saugojimas" }, { type: "paragraph", text: "Duomenys tvarkomi sutikimo, sutarties vykdymo, teisinės prievolės ir teisėto intereso pagrindu pagal GDPR. Duomenys saugomi tik tiek, kiek būtina tvarkymo tikslui arba teisės aktų reikalavimams." }, { type: "heading", text: "Duomenų subjekto teisės" }, { type: "paragraph", text: "Turite teisę prašyti prieigos, taisymo, ištrynimo, tvarkymo apribojimo, duomenų perkeliamumo, atšaukti sutikimą ir pateikti skundą priežiūros institucijai. Rašykite info@karatekas.eu." }] },
    gdpr: { title: "GDPR", description: "Fizinio asmens duomenų tvarkymo taisyklės.", blocks: [{ type: "heading", text: "Duomenų valdytojas" }, { type: "paragraph", text: "BBK AUTO, SIA, reg. Nr. 40003924244, adresas Rīga, Ilūkstes iela 103 k-3 - 29, LV-1082, yra duomenų valdytojas ir laikosi ES Bendrojo duomenų apsaugos reglamento 2016/679." }, { type: "heading", text: "Tvarkymo tikslai" }, { type: "paragraph", text: "Duomenys tvarkomi klientų santykiams administruoti, užsakymams formuoti, sąskaitoms išrašyti, mokėjimams ir pristatymui užtikrinti bei teisėtiems bendrovės interesams įgyvendinti." }, { type: "heading", text: "Prieiga ir atskleidimas" }, { type: "paragraph", text: "Prieigą prie duomenų turi tik darbuotojai, kuriems jie būtini pareigoms atlikti. Duomenys gali būti atskleidžiami valstybės institucijoms pagal teisėtą ir motyvuotą prašymą." }, { type: "heading", text: "Duomenų subjekto teisės" }, { type: "paragraph", text: "Asmenys turi teisę tikrinti savo duomenis, prašyti juos ištaisyti, ištrinti ar papildyti ir uždrausti naudoti duomenis tikslais, nesusijusiais su paslaugų teikimu." }] },
    cookies: { title: "Slapukai", description: "Informacija apie Karatekas.eu naudojamus slapukus.", blocks: [{ type: "heading", text: "Kas yra slapukas?" }, { type: "paragraph", text: "Slapukas yra mažas tekstinis failas, kurį svetainė išsaugo jūsų kompiuteryje ar mobiliajame įrenginyje. Slapukai padeda įsiminti nustatymus, pagerinti patogumą ir atpažinti naršyklę vėlesnių apsilankymų metu." }, { type: "heading", text: "Kaip naudojame slapukus?" }, { type: "list", items: ["kad prisimintume, ar sutikote su slapukų naudojimu;", "YouTube, Vimeo ir Google Maps funkcijoms;", "Google Analytics, kad gerintume turinį ir pritaikytume svetainę vartotojų poreikiams."] }, { type: "heading", text: "Kaip išjungti slapukus?" }, { type: "paragraph", text: "Slapukus galite ištrinti arba blokuoti naršyklės nustatymuose. Tokiu atveju kai kurios svetainės funkcijos gali veikti ne visiškai." }] },
  },
};

export function legalPageForLanguage(slug: LegalPageSlug, language: Language) {
  return localizedLegalPages[language]?.[slug] ?? legalPages[slug];
}

export function legalServiceTitle(slug: LegalPageSlug, language: Language) {
  return legalServiceTitles[language]?.[slug] ?? legalServiceTitles.en[slug];
}

export const legalPages: Record<LegalPageSlug, LegalPageContent> = {
  "delivery-information": {
    title: "Delivery Information",
    description: "Delivery costs and product delivery terms for Karatekas.eu orders.",
    blocks: [
      { type: "heading", text: "DELIVERY COSTS:" },
      {
        type: "paragraph",
        text:
          "The delivery fee for the rest of Latvia is calculated based on the specified delivery address, taking into account the total weight of the items. The exact delivery costs will be shown after adding the desired items to the Shopping Cart and clicking the Proceed to Checkout button.",
      },
      { type: "heading", text: "PRODUCT DELIVERY:" },
      {
        type: "paragraph",
        text:
          "If any of the items are not available in the warehouse at the time of ordering, you will be notified via email. In such cases, delivery times may be subject to change. We deliver orders through Omniva and DPD parcel machines.",
      },
      {
        type: "paragraph",
        text:
          "If the item is not available in stock in Riga, the delivery for the backordered item takes from 1 to 4 weeks.",
      },
    ],
  },
  payments: {
    title: "Payments",
    description: "Ordering and payment information for Karatekas.eu customers.",
    blocks: [
      { type: "heading", text: "EVERYTHING YOU NEED TO KNOW ABOUT ORDERING:" },
      {
        type: "list",
        items: [
          "The products and prices displayed on the Karatekas.eu online store are for informational purposes.",
          "The delivery fee for each item is indicated separately and may vary depending on the delivery region.",
          "Prices and product offerings on the online store may be subject to change without prior notice.",
          "The product descriptions on Karatekas.eu are based on the specifications provided by the manufacturer and may change due to manufacturer-specified modifications, changes, or upgrades.",
        ],
      },
      { type: "heading", text: "PAYMENT FOR ORDERS:" },
      {
        type: "paragraph",
        text:
          "You can make payment for your Karatekas.eu orders via bank transfer before the delivery of the goods. Upon receiving the goods, you will be provided with a delivery note and the original invoice if required. When making payment via bank transfer, you will receive an invoice via email with the bank details and the order number, which should be indicated in the payment reference. Karatekas.eu expects payment via bank transfer to be made within 3 days, looking forward to a successful cooperation.",
      },
    ],
  },
  "return-of-goods": {
    title: "Return of Goods",
    description: "Return of goods and right of withdrawal for Karatekas.eu orders.",
    blocks: [
      { type: "heading", text: "Return of Goods and Right of Withdrawal" },
      {
        type: "paragraph",
        text:
          "The buyer has the right to use the right of withdrawal and unilaterally withdraw from the purchase made on the online store karatekas.eu within 14 (fourteen) days and return the product to the Seller. The withdrawal period starts from the day the buyer or a third party other than the carrier and designated by the buyer acquires physical possession of the goods.",
      },
      { type: "heading", text: "Declining the purchase:" },
      {
        type: "paragraph",
        text:
          "If the item is not suitable or does not meet your requirements, you have the right to return or exchange the item for a different size or model within 14 days from the date of receiving the item.",
      },
      {
        type: "paragraph",
        text:
          "To return or exchange the item, you need to fill out the return form, which is included with the shipment, and send the shipment using Omniva terminals.",
      },
      {
        type: "paragraph",
        text:
          "You can return the items via Omniva parcel locker Rīgas Deglava ielas Maxima XXX pakomāts, Augusta Deglava iela 67, Rīga, specifying the phone number: +37125168811, and attaching the purchase receipt.",
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How BBK AUTO, SIA processes and stores personal data on Karatekas.eu.",
    blocks: [
      { type: "heading", text: "General Provisions" },
      {
        type: "paragraph",
        text:
          "1.1. This Privacy Policy describes how BBK AUTO, SIA, registration number 40003924244, Rīga, Ilūkstes iela 103 k-3 – 29, LV-1082 (hereinafter also referred to as the Data Controller) obtains, processes, and stores personal data obtained from its customers and individuals who visit the website (hereinafter referred to as the Data Subject or You).",
      },
      {
        type: "paragraph",
        text:
          "1.2. Personal data is any information relating to an identified or identifiable natural person, i.e., the Data Subject. Processing is any operation related to personal data, such as collection, recording, organization, use, viewing, erasure, or destruction.",
      },
      {
        type: "paragraph",
        text:
          "1.3. The Data Controller complies with the applicable data processing principles and ensures that personal data is processed in accordance with the applicable legislation.",
      },
      { type: "heading", text: "Collection, Processing, and Storage of Personal Data" },
      {
        type: "paragraph",
        text:
          "2.1. The Data Controller obtains, processes, and stores personally identifiable information primarily through the website and email.",
      },
      {
        type: "paragraph",
        text:
          "2.2. By visiting and using the services provided on the website, you agree that any provided information is used and managed in accordance with the purposes specified in this Privacy Policy.",
      },
      {
        type: "paragraph",
        text:
          "2.3. The Data Subject is responsible for ensuring that the provided personal data is correct, accurate, and complete. Providing knowingly false information is considered a violation of our Privacy Policy. The Data Subject is obliged to immediately inform the Data Controller of any changes in the provided personal data.",
      },
      {
        type: "paragraph",
        text:
          "2.4. The Data Controller is not responsible for any losses incurred by the Data Subject or third parties due to falsely provided personal data.",
      },
      { type: "heading", text: "Processing of Customer Personal Data" },
      {
        type: "paragraph",
        text: "3.1. The Data Controller may process the following personal data:",
      },
      {
        type: "list",
        items: [
          "Full name",
          "Date of birth",
          "Contact information (email address and/or phone number)",
          "Transaction data (purchased items, delivery address, price, payment information, etc.)",
          "Any other information provided to us during the use of the website’s services and purchasing of goods or when contacting us.",
        ],
      },
      {
        type: "paragraph",
        text:
          "3.2. In addition to the above, the Data Controller has the right to verify the accuracy of the submitted data using publicly available registers.",
      },
      {
        type: "paragraph",
        text:
          "3.3. The legal basis for the processing of personal data is Article 6(1)(a), (b), (c), and (f) of the General Data Protection Regulation (GDPR):",
      },
      {
        type: "list",
        items: [
          "(a) The data subject has given consent to the processing of his or her personal data for one or more specific purposes;",
          "(b) Processing is necessary for the performance of a contract to which the data subject is a party or in order to take steps at the request of the data subject prior to entering into a contract;",
          "(c) Processing is necessary for compliance with a legal obligation to which the controller is subject;",
          "(f) Processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party, except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject which require protection of personal data, in particular where the data subject is a child.",
        ],
      },
      {
        type: "paragraph",
        text:
          "3.4. The Data Controller stores and processes the Data Subject’s personal data as long as at least one of the criteria listed below is met:",
      },
      {
        type: "list",
        items: [
          "The personal data are necessary for the purposes for which they were collected;",
          "As long as the Data Controller and/or the Data Subject can exercise their legitimate interests in accordance with external regulations, such as submitting objections or asserting or defending legal claims;",
          "As long as there is a legal obligation to retain the data, such as in accordance with the Accounting Law;",
          "As long as the Data Subject’s consent to the respective processing of personal data is in force, unless there is another lawful basis for the processing of personal data.",
        ],
      },
      {
        type: "paragraph",
        text:
          "Once the conditions listed in this point cease to exist, the storage period for the Data Subject’s personal data ends, and all relevant personal data is irreversibly deleted from computer systems and electronic and/or paper documents containing the respective personal data or these documents are anonymized.",
      },
      {
        type: "paragraph",
        text:
          "3.5. In order to fulfill its obligations to you, the Data Controller has the right to transfer your personal data to its partners, data processors who carry out the necessary data processing on our behalf, such as accountants, courier services, etc. A data processor is a data controller. Payment processing is provided by the payment platform makecommerce.lv, so our company provides the necessary personal data for payment execution to the owner of the platform, Maksekeskus AS. Upon request, we may disclose your personal data to state and law enforcement agencies to protect our legal interests by initiating, filing, and defending legal claims.",
      },
      {
        type: "paragraph",
        text:
          "3.6. When processing and storing personal data, the Data Controller implements organizational and technical measures to ensure the protection of personal data against accidental or unlawful destruction, alteration, disclosure, and any other unlawful processing.",
      },
      { type: "heading", text: "Rights of the Data Subject" },
      {
        type: "paragraph",
        text:
          "4.1. In accordance with the General Data Protection Regulation and the laws of the Republic of Latvia, you have the right to:",
      },
      {
        type: "list",
        items: [
          "Access your personal data, receive information about its processing, request a copy of your personal data in electronic format, and the right to request the transfer of this data to another controller (data portability);",
          "Request the correction of inaccurate, incorrect, or incomplete personal data;",
          "Request the erasure of your personal data (“right to be forgotten”), except in cases where the law requires data retention;",
          "Withdraw your previously given consent for the processing of personal data;",
          "Restrict the processing of your data – the right to request that we temporarily completely stop processing all your personal data;",
          "Lodge a complaint with the Data State Inspectorate. You can exercise your rights by filling out a form in person at Viestura iela 6, Jūrmala, LV-2010, or by submitting a request electronically by writing to info@karatekas.eu.",
        ],
      },
      { type: "heading", text: "Final Provisions" },
      {
        type: "paragraph",
        text:
          "5.1. This Privacy Policy is developed in accordance with Regulation (EU) 2016/679 and the laws of the Republic of Latvia and the European Union in force.",
      },
      {
        type: "paragraph",
        text:
          "5.2. The Data Controller has the right to make changes or additions to this Privacy Policy at any time and without prior notice. The amendments become effective upon publication on the website https://karatekas.eu.",
      },
    ],
  },
  gdpr: {
    title: "GDPR",
    description: "Fiziskās personas datu apstrādes noteikumi.",
    blocks: [
      { type: "heading", text: "Fiziskās personas (Datu subjekta) datu apstrādes noteikumi:" },
      {
        type: "paragraph",
        text:
          "BBK AUTO, SIA (reģistrēts Latvijas Republikas Uzņēmumu reģistrā, reģ.nr.40003924244, juridiskā adrese: Rīga, Ilūkstes iela 103 k-3 – 29, LV-1082) (turpmāk – BBK AUTO), ir Pārzinis, kurš izpilda Eiropas Savienības Vispārīgās Datu Aizsardzības Regulas Nr.2016/679 prasības Latvijā.",
      },
      {
        type: "paragraph",
        text:
          "Šī Privātuma politika nosaka, kā BBK AUTO apstrādā personas datus, kad tiek izmantoti mūsu pakalpojumi. Šī politika attiecas uz visa veida personas datu apstrādi, ko SIA BBK AUTO ievāc no mājas lapām, e-pastu sarakstēm, līgumiem un citiem avotiem.",
      },
      { type: "heading", text: "Datu apstrādes nolūki:" },
      {
        type: "paragraph",
        text:
          "DATUS apstrādā ar nolūku administrēt līdzēju savstarpējas attiecības saistībā ar SABIEDRĪBAS sniegtajiem pakalpojumiem, izrakstīt un izsniegt rēķinus, nodrošināt pakalpojumu rezervāciju un to apmaksu, kā arī drošības līdzekļu rezervāciju, lai realizētu SABIEDRĪBAS likumiskās intereses, ievērojot fiziskās personas (datu subjekta) pamattiesības un brīvības.",
      },
      { type: "heading", text: "Piekļuve DATIEM un to glabāšana" },
      {
        type: "paragraph",
        text:
          "DATI tiek ierakstīti pakalpojumu līgumos, SABIEDRĪBAS grāmatvedības programmā un pakalpojumu administrēšanas programmās. DATI tiek aizsargāti pret nesankcionētu piekļuvi, un to izmantošana tiek uzraudzīta atbilstoši normatīvo aktu prasībām.",
      },
      {
        type: "paragraph",
        text:
          "Piekļuve programmām un līdz ar to DATIEM ir tikai tiem SABIEDRĪBAS darbiniekiem, kuriem tie ir nepieciešami darba pienākumu izpildei un pakalpojumu pienācīgai sniegšanai. DATI netiks nosūtīti ārpus Eiropas Savienības/Eiropas Ekonomiskās zonas (ES/EEZ), ja vien tas nav nepieciešams datu tehniskai aizsardzībai.",
      },
      { type: "heading", text: "DATU izpaušana" },
      {
        type: "paragraph",
        text:
          "SABIEDRĪBA ir tiesīga izsniegt DATUS tiesībsargājošām institūcijām, nodokļu pārvaldes un uzraudzības iestādēm, pamatojoties uz likumīgu un motivētu iestādes vai amatpersonas pieprasījumu.",
      },
      { type: "heading", text: "DATU glabāšanas ilgums" },
      {
        type: "paragraph",
        text:
          "DATI tiks glabāti saskaņā ar pakalpojuma līguma darbības laiku. Pēc līguma izbeigšanās DATI vēl tiks uzglabāti tādu laika periodu, lai izpildītu normatīvo aktu prasības.",
      },
      { type: "heading", text: "Datu subjekta tiesības" },
      {
        type: "paragraph",
        text:
          "Fiziskām personām ir tiesības pārbaudīt ar sevi saistītus DATUS, kas nodoti SABIEDRĪBAS rīcībā, pieprasīt tos izlabot, dzēst vai papildināt nepareizi norādītos datus, aizliegt izmantot savus datus mērķiem, kas nav saistīti ar SABIEDRĪBAS pakalpojumu sniegšanu.",
      },
    ],
  },
  cookies: {
    title: "Cookies",
    description: "Cookie information for Karatekas.eu visitors.",
    blocks: [
      { type: "heading", text: "What is a cookie?" },
      {
        type: "paragraph",
        text:
          "A cookie is a small text file that is sent to your computer or mobile device during your visit to a website and is stored by the website on your computer or mobile device when you open the site. Each time you visit subsequently, cookies are sent back to the originating website or to another website that recognizes this cookie.",
      },
      {
        type: "paragraph",
        text:
          "Cookies act as the memory of a specific webpage, allowing the page to remember your computer on your next visits, including remembering your settings or improving user convenience. Additional information about cookies, as well as how to manage or delete them, can be found on www.aboutcookies.org.",
      },
      { type: "heading", text: "How do we use cookies?" },
      {
        type: "paragraph",
        text: "Karatekas.eu website uses cookies for the website to remember:",
      },
      {
        type: "list",
        items: [
          "whether you have already agreed that we use cookies on this site;",
          "YouTube and Vimeo cookies, including unique identifiers assigned to the computer to track video views;",
          "Google Maps cookies, which record the use of maps;",
          "Google Analytics cookies created by Google Inc. to improve content quality and adapt website content to user needs.",
        ],
      },
      {
        type: "paragraph",
        text:
          "If you want Karatekas.eu not to obtain information about your activities on the Karatekas.eu website, you need to activate the Google Analytics Opt-out Browser Add-on.",
      },
      { type: "heading", text: "How to disable cookies?" },
      {
        type: "paragraph",
        text:
          "At your discretion, you can control and delete cookies. You can delete all cookies on your computer, and most web browsers can be set to block the insertion of cookies on your computer. However, in this case, you will manually need to adjust the settings each time you visit the website, and there is a possibility that some services and features will not work.",
      },
    ],
  },
};
