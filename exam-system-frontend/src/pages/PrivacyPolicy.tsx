import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50"
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-8">
                    隱私權政策
                </h1>

                <div className="space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. 資訊收集與使用</h2>
                        <p>
                            當您使用本測驗系統並透過 Google 帳號登入時，我們將收集您於 Google 的基本公開資訊（包括：電子郵件地址與姓名）。這些資訊僅用於驗證您的身分與建立系統帳號，以便您能順利參與或管理測驗。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. 資訊保護</h2>
                        <p>
                            我們採取適當的系統安全防護措施（如資料加密與權限控管），以防止您的個人資料被未經授權的存取、竄改、披露或毀損。所有與 Google 認證的連線皆透過加密（HTTPS）進行。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. 資訊分享與揭露</h2>
                        <p>
                            除法律要求或為了提供您本系統核心服務之外，我們不會將您的個人資訊出售、交換或出租給任何第三方。您的資料僅在系統內部用於測驗管理與成績呈現。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. 您的權利</h2>
                        <p>
                            您有權隨時在系統中檢視或透過聯絡管理員要求刪除您的帳號及關聯的個人資訊。當您撤銷 Google OAuth 的授權時，系統將無法再透過您的 Google 帳號獲取新資訊。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. 政策修訂</h2>
                        <p>
                            我們保留隨時修改本隱私權政策的權利。重大變更將於系統公告，您繼續使用本服務即視為同意接受修改後的聲明。
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicy;
