import type { LegalPageSlug } from "./legal-service-links";

type LegalBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export const legalPages: Record<
  LegalPageSlug,
  {
    title: string;
    description: string;
    blocks: LegalBlock[];
  }
> = {
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
