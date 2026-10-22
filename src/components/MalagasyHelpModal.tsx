import React from 'react';
import {
  HelpCircle,
  Phone,
  MapPin,
  Sparkles,
  Facebook,
  CheckCircle2,
  X
} from 'lucide-react';

interface MalagasyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MalagasyHelpModal: React.FC<MalagasyHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#14141c] border border-zinc-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              MG
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Torolalana & Fanampiana — MIKROTECK 301
              </h3>
              <p className="text-xs text-zinc-400">
                Torolalana amin'ny teny Malagasy sy Frantsay ho an'ny fampiasana ny Bot AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content in Malagasy */}
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-400" />
              1. Ahoana ny fomba fiasan'ny Bot MIKROTECK 301 ?
            </h4>
            <p className="text-zinc-400">
              Ity application ity dia mampiasa ny Google Gemini AI mba hamaliana avy hatrany ny hafatra
              mandalo amin'ny Facebook Messenger an'ny MIKROTECK 301. Mahay miteny Frantsay sy Malagasy
              ny bot, ary manaja tanteraka ny vidin'ny fitaovana voarakitra ato amin'ny tableau de bord.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-400" />
              2. Ireo fitaovana Wi-Fi sy ny vidiny ofisialy :
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-black/40 border border-zinc-800">
                <span className="text-white font-bold">Tenda AC5 AC1200 :</span>{' '}
                <span className="text-red-400">85 000 Ar</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-zinc-800">
                <span className="text-white font-bold">OS3 5 km 5 GHz :</span>{' '}
                <span className="text-red-400">180 000 Ar</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-zinc-800">
                <span className="text-white font-bold">Tenda 01 1 km 5 GHz :</span>{' '}
                <span className="text-red-400">135 000 Ar</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-zinc-800">
                <span className="text-white font-bold">Pack OS3 + AC5 :</span>{' '}
                <span className="text-red-400">265 000 Ar</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-zinc-800 col-span-full">
                <span className="text-white font-bold">Pack Tenda 01 + AC5 :</span>{' '}
                <span className="text-red-400">215 000 Ar</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" />
              3. Fifandraisana mivantana :
            </h4>
            <p className="text-zinc-400">
              Raha misy mpanjifa mila fanampiana manokana na tsy hain'ny bot novaliana, afaka tsindriana
              ny bokotra <strong>« Mode Humain »</strong> ao amin'ny Boîte de Réception mba hamalianao
              azy mivantana.
            </p>
            <div className="pt-1 flex items-center gap-4 text-zinc-300 font-mono text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> Imandry, Fianarantsoa
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-red-400" /> 038 28 171 00
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md"
          >
            Mazava tsara (Fermer)
          </button>
        </div>
      </div>
    </div>
  );
};
