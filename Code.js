const APP_VERSION = '1.0.0';

// الإيميلات المسموح لها بالدخول
const APPROVED_EMAILS = [
  'you@example.com',
  'agent1@example.com',
  'agent2@example.com'
];

// البيانات كلها يدويًا هنا
const SCRIPT_DATA = [
  {
    id: 'problem_1',
    name: 'تأخير الطلب',
    steps: [
      {
        id: 'step_1',
        name: 'ترحيب',
        scripts: [
          { id: 's1', text: 'أهلًا وسهلًا، معك خدمة العملاء، كيف أقدر أساعدك اليوم؟', rating: 4.8 },
          { id: 's2', text: 'مرحبًا بك، يسعدني خدمتك بخصوص طلبك.', rating: 4.6 }
        ]
      },
      {
        id: 'step_2',
        name: 'اعتذار',
        scripts: [
          { id: 's3', text: 'نعتذر جدًا عن تأخر الطلب ونقدر تفهمك.', rating: 4.9 },
          { id: 's4', text: 'آسفين على التأخير الحاصل، وسأتابع الموضوع معك الآن.', rating: 4.7 }
        ]
      },
      {
        id: 'step_3',
        name: 'تأكيد الطلب',
        scripts: [
          { id: 's5', text: 'اسمح لي أتأكد من رقم الطلب وبعض البيانات حتى أخدمك بشكل أدق.', rating: 4.5 }
        ]
      },
      {
        id: 'step_4',
        name: 'حل',
        scripts: [
          { id: 's6', text: 'تم رفع طلب متابعة عاجلة للطلب، وسيتم التواصل معك فور التحديث.', rating: 4.8 }
        ]
      },
      {
        id: 'step_5',
        name: 'إنهاء',
        scripts: [
          { id: 's7', text: 'شكرًا لتواصلك معنا، وإذا احتجت أي مساعدة إضافية نحن بالخدمة.', rating: 4.9 }
        ]
      }
    ]
  },
  {
    id: 'problem_2',
    name: 'طلب إلغاء',
    steps: [
      {
        id: 'step_6',
        name: 'ترحيب',
        scripts: [
          { id: 's8', text: 'أهلًا بك، سأساعدك بخصوص طلب الإلغاء بكل سرور.', rating: 4.7 }
        ]
      },
      {
        id: 'step_7',
        name: 'تأكيد البيانات',
        scripts: [
          { id: 's9', text: 'اسمح لي أتأكد من رقم الطلب والبيانات قبل تنفيذ طلب الإلغاء.', rating: 4.6 }
        ]
      },
      {
        id: 'step_8',
        name: 'تنفيذ الحل',
        scripts: [
          { id: 's10', text: 'تم تسجيل طلب الإلغاء وسيتم تحديث الحالة حسب السياسة المعتمدة.', rating: 4.8 }
        ]
      }
    ]
  }
];

function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.appVersion = APP_VERSION;
  return template
    .evaluate()
    .setTitle('Call Center Scripts')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppPayload() {
  const email = Session.getActiveUser().getEmail() || '';
  const isApproved = APPROVED_EMAILS.includes(email);

  return {
    version: APP_VERSION,
    email: email,
    isApproved: isApproved,
    data: isApproved ? SCRIPT_DATA : []
  };
}
