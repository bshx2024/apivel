import fs from 'node:fs/promises'
import path from 'node:path'

const LOCALES_DIR = path.resolve('web/default/src/i18n/locales')

const newKeys = {
  en: {
    "256-Bit SSL Encrypted Instant Checkout": "256-Bit SSL Encrypted Instant Checkout",
    "Recommended • Global": "Recommended • Global",
    "PayPal Instant Checkout": "PayPal Instant Checkout",
    "Credit Card & Global Pay": "Credit Card & Global Pay",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "Supports PayPal Balance, Bank Cards & Buyer Protection",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "Visa, Mastercard, Amex, Apple Pay & Google Pay",
    "Instant Account Credit Activation": "Instant Account Credit Activation",
    "Buyer Protection": "Buyer Protection",
    "Instant Activation": "Instant Activation",
    "3D Secure Protection": "3D Secure Protection",
    "Multi-Currency": "Multi-Currency",
    "Instant Credit": "Instant Credit",
    "Pay Now →": "Pay Now →",
    "Connecting...": "Connecting...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)",
    "Ends In": "Ends In",
    "Verified Global Payment Channel": "Verified Global Payment Channel",
    "999+ Verified Buyers": "999+ Verified Buyers",
    "Instant 0-Delay Activation": "Instant 0-Delay Activation",
    "256-Bit Bank-Grade SSL": "256-Bit Bank-Grade SSL",
    "Credits Never Expire": "Credits Never Expire"
  },
  zh: {
    "256-Bit SSL Encrypted Instant Checkout": "256位银行级加密即时收银",
    "Recommended • Global": "推荐 • 全球通用",
    "PayPal Instant Checkout": "PayPal 官方即时结账",
    "Credit Card & Global Pay": "国际信用卡 / 全球安全收银",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "支持 PayPal 余额、国际主流银行卡 • 买家安全保障",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "支持 Visa、Mastercard、Amex、Apple Pay 及微信支付",
    "Instant Account Credit Activation": "即时秒级充值到账",
    "Buyer Protection": "官方买家保障",
    "Instant Activation": "0秒极速到账",
    "3D Secure Protection": "3D Secure 银行级防护",
    "Multi-Currency": "多币种支持",
    "Instant Credit": "即时到账",
    "Pay Now →": "立即支付 →",
    "Connecting...": "正在连接...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "微信支付提示：选择国际信用卡后，在收银台首步的国家（Country）下拉框中选择「China / 中国」，即可使用微信扫码支付。",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "新用户专享特惠：首次充值 $2 享 34% 折扣（仅需 $1.32）",
    "Ends In": "距结束仅剩",
    "Verified Global Payment Channel": "已认证全球官方安全支付通道",
    "999+ Verified Buyers": "999+ 开发者认证好评",
    "Instant 0-Delay Activation": "0延迟即时生效",
    "256-Bit Bank-Grade SSL": "256位银行级SSL加密",
    "Credits Never Expire": "额度永久不过期"
  },
  fr: {
    "256-Bit SSL Encrypted Instant Checkout": "Paiement instantané sécurisé SSL 256 bits",
    "Recommended • Global": "Recommandé • International",
    "PayPal Instant Checkout": "Paiement instantané PayPal",
    "Credit Card & Global Pay": "Carte bancaire et paiement mondial",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "Compatible solde PayPal, cartes bancaires et Protection des Achats",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "Visa, Mastercard, Amex, Apple Pay & Google Pay",
    "Instant Account Credit Activation": "Activation instantanée du solde",
    "Buyer Protection": "Protection des Achats",
    "Instant Activation": "Activation instantanée",
    "3D Secure Protection": "Protection 3D Secure",
    "Multi-Currency": "Multi-devises",
    "Instant Credit": "Crédit instantané",
    "Pay Now →": "Payer maintenant →",
    "Connecting...": "Connexion en cours...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "Notice WeChat Pay : Sélectionnez « Carte bancaire et paiement mondial », puis choisissez « China » dans le menu déroulant du pays pour payer par scan WeChat.",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "Offre nouveaux utilisateurs : 1ère recharge 2 $ à -34 % (seulement 1,32 $)",
    "Ends In": "Se termine dans",
    "Verified Global Payment Channel": "Canal de paiement mondial vérifié",
    "999+ Verified Buyers": "999+ acheteurs vérifiés",
    "Instant 0-Delay Activation": "Activation instantanée 0 délai",
    "256-Bit Bank-Grade SSL": "SSL 256 bits de niveau bancaire",
    "Credits Never Expire": "Les crédits n'expirent jamais"
  },
  ja: {
    "256-Bit SSL Encrypted Instant Checkout": "256ビットSSL暗号化による即時安全決済",
    "Recommended • Global": "推奨 • グローバル対応",
    "PayPal Instant Checkout": "PayPal 公式インスタント決済",
    "Credit Card & Global Pay": "国際クレジットカード / グローバル決済",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "PayPal残高・主要クレジットカード対応 • 買い手保護制度",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "Visa, Mastercard, Amex, Apple Pay, Google Pay 対応",
    "Instant Account Credit Activation": "即時クレジット反映",
    "Buyer Protection": "買い手保護制度",
    "Instant Activation": "即時有効化",
    "3D Secure Protection": "3Dセキュア保護",
    "Multi-Currency": "多通貨対応",
    "Instant Credit": "即時チャージ",
    "Pay Now →": "今すぐ支払う →",
    "Connecting...": "接続中...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "WeChat Payをご利用の方へ：「国際クレジットカード」を選択後、決済画面の国（Country）で「China / 中国」を選択するとWeChat決済をご利用いただけます。",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "新規ユーザー限定特典：初回 $2 チャージが 34% OFF（わずか $1.32）",
    "Ends In": "残り時間",
    "Verified Global Payment Channel": "グローバル認証安全決済チャンネル",
    "999+ Verified Buyers": "999+ 認証バイヤー",
    "Instant 0-Delay Activation": "待ち時間ゼロの即時反映",
    "256-Bit Bank-Grade SSL": "256ビット銀行級SSL暗号化",
    "Credits Never Expire": "クレジットは無期限有効"
  },
  ru: {
    "256-Bit SSL Encrypted Instant Checkout": "Мгновенная оплата с 256-битным SSL-шифрованием",
    "Recommended • Global": "Рекомендуется • Международный",
    "PayPal Instant Checkout": "Официальная мгновенная опла塔 PayPal",
    "Credit Card & Global Pay": "Банковские карты и международная оплата",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "Поддержка баланса PayPal, банковских карт и защита покупателей",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "Visa, Mastercard, Amex, Apple Pay и Google Pay",
    "Instant Account Credit Activation": "Мгновенное зачисление средств на баланс",
    "Buyer Protection": "Защита покупателей",
    "Instant Activation": "Мгновенная активация",
    "3D Secure Protection": "Защита 3D Secure",
    "Multi-Currency": "Мультивалютность",
    "Instant Credit": "Мгновенное зачисление",
    "Pay Now →": "Оплатить сейчас →",
    "Connecting...": "Подключение...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "Оплата WeChat: выберите «Банковские карты», затем укажите страну «China» в выпадающем списке, чтобы оплатить через WeChat Pay.",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "Специальное предложение: первое пополнение $2 со скидкой 34% (всего $1.32)",
    "Ends In": "До окончания",
    "Verified Global Payment Channel": "Проверенный международный канал оплаты",
    "999+ Verified Buyers": "999+ проверенных покупателей",
    "Instant 0-Delay Activation": "Мгновенная активация без задержек",
    "256-Bit Bank-Grade SSL": "Банковский 256-битный SSL",
    "Credits Never Expire": "Срок действия средств не ограничен"
  },
  vi: {
    "256-Bit SSL Encrypted Instant Checkout": "Thanh toán tức thì bảo mật SSL 256-bit chuẩn ngân hàng",
    "Recommended • Global": "Khuyên dùng • Toàn cầu",
    "PayPal Instant Checkout": "Thanh toán tức thì chính thức qua PayPal",
    "Credit Card & Global Pay": "Thẻ quốc tế & Thanh toán toàn cầu",
    "Supports PayPal Balance, Bank Cards & Buyer Protection": "Hỗ trợ số dư PayPal, thẻ ngân hàng & bảo vệ người mua",
    "Visa, Mastercard, Amex, Apple Pay & Google Pay": "Visa, Mastercard, Amex, Apple Pay & Google Pay",
    "Instant Account Credit Activation": "Kích hoạt số dư tài khoản tức thì",
    "Buyer Protection": "Bảo vệ người mua",
    "Instant Activation": "Kích hoạt tức thì",
    "3D Secure Protection": "Bảo mật 3D Secure",
    "Multi-Currency": "Đa tiền tệ",
    "Instant Credit": "Cộng tiền tức thì",
    "Pay Now →": "Thanh toán ngay →",
    "Connecting...": "Đang kết nối...",
    "WeChat Pay Notice: Select \"Credit Card & Global Pay\", then choose \"China / 中国\" in the checkout country dropdown to pay via WeChat scan.": "Lưu ý WeChat Pay: Chọn «Thẻ quốc tế & Toàn cầu», sau đó chọn quốc gia «China / 中国» ở bước thanh toán để quét mã WeChat Pay.",
    "New User Limited Offer: First Top-Up $2 at 34% OFF (Only $1.32)": "Ưu đãi người dùng mới: Nạp lần đầu $2 giảm 34% (chỉ còn $1.32)",
    "Ends In": "Kết thúc sau",
    "Verified Global Payment Channel": "Kênh thanh toán toàn cầu được xác thực",
    "999+ Verified Buyers": "999+ người mua đã xác thực",
    "Instant 0-Delay Activation": "Kích hoạt tức thì không độ trễ",
    "256-Bit Bank-Grade SSL": "Mã hóa SSL 256-bit chuẩn ngân hàng",
    "Credits Never Expire": "Số dư không bao giờ hết hạn"
  }
}

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + '\n'
}

async function main() {
  let totalAdded = 0

  for (const [locale, trans] of Object.entries(newKeys)) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`)
    const json = JSON.parse(await fs.readFile(filePath, 'utf8'))

    let count = 0
    for (const [key, value] of Object.entries(trans)) {
      if (!json.translation[key] || json.translation[key] !== value) {
        json.translation[key] = value
        count++
      }
    }

    if (count > 0) {
      json.translation = Object.fromEntries(
        Object.entries(json.translation).sort(([a], [b]) => a.localeCompare(b))
      )
      await fs.writeFile(filePath, stableStringify(json), 'utf8')
    }

    console.log(`${locale}: ${count} translations applied`)
    totalAdded += count
  }

  console.log(`\nTotal: ${totalAdded} translations applied`)
}

main().catch((err) => { console.error(err); process.exitCode = 1 })
