import { getUncachableStripeClient } from './stripeClient';

const creditPackages = [
  {
    name: 'ライトパック',
    credits: 100,
    bonusCredits: 0,
    priceJpy: 1000,
    description: 'はじめての方におすすめ',
    badge: '',
    perks: ['全モデル利用可能', 'クレジット無期限'],
  },
  {
    name: 'スタンダード',
    credits: 300,
    bonusCredits: 30,
    priceJpy: 3000,
    description: '気軽にお試しできるパック',
    badge: '',
    perks: ['全モデル利用可能', 'クレジット無期限', '+10% ボーナス'],
  },
  {
    name: 'クリエイター',
    credits: 500,
    bonusCredits: 100,
    priceJpy: 5000,
    description: '本格的な制作に',
    badge: 'おすすめ',
    perks: ['全モデル利用可能', 'クレジット無期限', '+20% ボーナス', '優先キュー'],
  },
  {
    name: 'プロフェッショナル',
    credits: 1000,
    bonusCredits: 300,
    priceJpy: 10000,
    description: 'プロの制作ワークフローに',
    badge: '人気',
    perks: ['全モデル利用可能', 'クレジット無期限', '+30% ボーナス', '優先キュー', '高解像度出力'],
  },
  {
    name: 'ビジネス',
    credits: 2000,
    bonusCredits: 800,
    priceJpy: 20000,
    description: 'チーム・ビジネス利用に',
    badge: '',
    perks: ['全モデル利用可能', 'クレジット無期限', '+40% ボーナス', '最優先キュー', '高解像度出力', '4K動画生成'],
  },
  {
    name: 'エンタープライズ',
    credits: 3000,
    bonusCredits: 1500,
    priceJpy: 30000,
    description: '大規模プロジェクト向け',
    badge: 'お得',
    perks: ['全モデル利用可能', 'クレジット無期限', '+50% ボーナス', '最優先キュー', '高解像度出力', '4K動画生成', '同時生成数UP'],
  },
  {
    name: 'スタジオ',
    credits: 5000,
    bonusCredits: 3000,
    priceJpy: 50000,
    description: 'スタジオ・制作会社向け',
    badge: 'ベストバリュー',
    perks: ['全モデル利用可能', 'クレジット無期限', '+60% ボーナス', '最優先キュー', '高解像度出力', '4K動画生成', '同時生成数UP', '専用サポート'],
  },
  {
    name: 'アンリミテッド',
    credits: 10000,
    bonusCredits: 8000,
    priceJpy: 100000,
    description: '最大規模のプロジェクトに',
    badge: '最上位',
    perks: ['全モデル利用可能', 'クレジット無期限', '+80% ボーナス', '最優先キュー', '高解像度出力', '4K動画生成', '同時生成数無制限', '専用サポート', 'APIアクセス'],
  },
];

export async function seedStripeProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    const existingProducts = await stripe.products.search({
      query: "metadata['app']:'pinetreeclub_v2'",
    });

    if (existingProducts.data.length > 0) {
      console.log(`Stripe v2 products already exist (${existingProducts.data.length} found), skipping seed.`);
      return;
    }

    console.log('Creating Stripe credit packages v2...');

    for (const pkg of creditPackages) {
      const totalCredits = pkg.credits + pkg.bonusCredits;
      const bonusPercent = pkg.bonusCredits > 0 ? Math.round((pkg.bonusCredits / pkg.credits) * 100) : 0;

      const product = await stripe.products.create({
        name: pkg.name,
        description: pkg.description,
        metadata: {
          app: 'pinetreeclub_v2',
          credits: String(totalCredits),
          base_credits: String(pkg.credits),
          bonus_credits: String(pkg.bonusCredits),
          bonus_percent: String(bonusPercent),
          badge: pkg.badge,
          perks: JSON.stringify(pkg.perks),
          type: 'credit_package',
        },
      });

      await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.priceJpy,
        currency: 'jpy',
      });

      console.log(`Created: ${pkg.name} - ¥${pkg.priceJpy.toLocaleString()} (${totalCredits} credits, +${bonusPercent}%)`);
    }

    console.log('Stripe v2 products seeded successfully.');
  } catch (error) {
    console.error('Failed to seed Stripe products:', error);
  }
}

export { creditPackages };
