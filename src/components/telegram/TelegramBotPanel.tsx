import React, { useState, useEffect } from 'react';
import { TelegramLog } from '../../types/index';
import { Bot, Send, RefreshCw, Terminal, CheckCircle2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const TelegramBotPanel: React.FC<Props> = ({ showToast }) => {
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [simCommand, setSimCommand] = useState('/today');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/telegram/logs');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (commandToRun?: string) => {
    const cmd = commandToRun || simCommand;
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, chatId: '987654321' })
      });
      if (res.ok) {
        showToast('success', `Perintah Telegram ${cmd} berhasil diproses!`);
        fetchLogs();
      } else {
        showToast('error', 'Gagal memproses simulasi perintah.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const commandButtons = [
    { cmd: '/start', desc: 'Menu Utama Bot & Daftar Perintah' },
    { cmd: '/today', desc: 'Rekap Laporan KUA Hari Ini' },
    { cmd: '/upcoming', desc: 'Jadwal Nikah & Kegiatan Mendatang' },
    { cmd: '/kendaraan', desc: 'Status Operasional Kendaraan Dinas' },
    { cmd: '/dokumen', desc: 'Status Kelengkapan Dokumen & Laporan' },
    { cmd: '/pembayaran', desc: 'Rekapitulasi Tukin & Uang Makan Staf' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Integrasi Bot Telegram Official KUA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notifikasi real-time & perintah otomatis melalui Telegram Bot API dengan Webhook & auto-retry.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Command Quick Launcher & Webhook Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Commands Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Simulasi Perintah Bot Telegram</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commandButtons.map(item => (
                <button
                  key={item.cmd}
                  onClick={() => {
                    setSimCommand(item.cmd);
                    handleSimulate(item.cmd);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{item.cmd}</span>
                    <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="text"
                value={simCommand}
                onChange={e => setSimCommand(e.target.value)}
                placeholder="Ketik perintah custom e.g. /today"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSimulate()}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </div>
          </div>

          {/* Webhook Configuration Box */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>WEBHOOK CONFIGURATION & HELPER</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                ACTIVE
              </span>
            </div>
            
            <p className="text-slate-400">Endpoint Webhook Telegram Official:</p>
            <div className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800 overflow-x-auto">
              POST https://[YOUR_DOMAIN]/api/telegram/webhook
            </div>

            <p className="text-slate-400 pt-1">Command Set Webhook via cURL:</p>
            <div className="p-2.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 overflow-x-auto">
              curl -F "url=https://YOUR_DOMAIN/api/telegram/webhook" https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
            </div>
          </div>

        </div>

        {/* Right Col: Live Telegram Message Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Log Notifikasi Telegram</span>
            </h3>
            <button
              onClick={fetchLogs}
              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Refresh Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                Belum ada aktivitas pesan Telegram.
              </p>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{log.command}</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
