import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50"
            >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-8">
                    服務條款
                </h1>

                <div className="space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. 接受條款</h2>
                        <p>
                            歡迎使用本測驗系統（以下簡稱「本系統」）。當您登入並使用本系統所提供的各項服務時，即表示您已閱讀、瞭解並同意接受本服務條款之所有內容。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. 帳號與安全性</h2>
                        <p>
                            您同意為透過您的帳號所進行之所有活動負起全責。請妥善保管您的認證憑證（包含 Google 登入狀態及系統發送的驗證碼），若發現帳號遭到盜用或有其他安全問題發生時，請立即通知系統管理員。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. 使用者行為準則</h2>
                        <p>
                            使用本系統時，禁止任何違法、侵權或破壞系統運作的行為，包含但不限於：作弊、未經授權存取系統資料、散播惡意程式碼，或干擾其他使用者之測驗進行。違反者將面臨帳號停權及成績作廢之處置。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. 服務之中斷與終止</h2>
                        <p>
                            本系統保留隨時修改、暫停或永久終止提供全部或部分服務之權利。在系統維護、升級或發生不可抗力因素時，可能會暫時中斷服務連線。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. 免責聲明</h2>
                        <p>
                            本系統依「現況」提供，我們不對服務的完全無誤、不中斷作任何明示或暗示的擔保。對於因使用或無法使用本系統服務而產生的任何直接、間接或衍生性損害，本系統不負賠償責任。
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsOfService;
