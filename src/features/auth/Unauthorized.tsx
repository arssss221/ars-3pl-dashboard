import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tr = (term: string) => t(`terms.${term}`, term);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-800 p-4">
      <ShieldAlert size={80} className="text-red-500 mb-4 animate-bounce" />
      <h1 className="text-3xl font-black mb-2 text-center">
        {tr('Access Denied!')}
      </h1>
      <p className="text-slate-500 font-bold mb-6 text-center">
        {tr('You do not have permission to access this page.')}
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-700 transition-colors"
      >
        {tr('Go Back Home')}
      </button>
    </div>
  );
}
