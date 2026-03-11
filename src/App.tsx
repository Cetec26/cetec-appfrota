import React, { useState, useEffect, useRef } from "react";
import {
  Truck,
  User,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  Send,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Check,
  Link2,
  Unlink,
  Calendar,
  Fuel
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DRIVERS = [
  "Alexsandro Felipe Demetrio",
  "André Luis de Andrade",
  "Gregory Matheus Maia Carnaval",
  "Gustavo Oliveira de Medeiros",
  "Hermes Augusto Martini",
  "Joaquim Domingos",
  "Julia de Freitas Capato",
  "Laércio Andreiov da Silva",
  "Leonadro Mourão Santos",
  "Patricia Aline Collebrusco Cardoso de Camargo",
  "Michael Jones da Silva de Camargo"
].sort();

const DRIVER_EXPIRATIONS: Record<string, string> = {
  "Alexsandro Felipe Demetrio": "2031-09-30",
  "André Luis de Andrade": "2024-10-17",
  "Gregory Matheus Maia Carnaval": "2034-02-05",
  "Gustavo Oliveira de Medeiros": "2035-01-14",
  "Hermes Augusto Martini": "2036-01-05",
  "Joaquim Domingos": "2024-01-01",
  "Julia de Freitas Capato": "2026-03-26",
  "Laércio Andreiov da Silva": "2032-09-13",
  "Leonadro Mourão Santos": "2035-05-07",
  "Patricia Aline Collebrusco Cardoso de Camargo": "2036-02-19",
  "Michael Jones da Silva de Camargo": "2034-04-17"
};

const VEHICLES = [
  "Uno AID8C51",
  "Strada Simples QPS9I59",
  "Strada CD AZL5B65",
  "Strada Endurance SDP4I02"
];

const CHECKLIST_ITEMS = [
  "Nível da Água do Radiador está okay?",
  "Nível do Oléo do Motor está okay?",
  "Pneus estão Calibrados estão okay?",
  "Faróis e Laternas de Seta estão okay?"
];

const LAST_KM_RECORDS: Record<string, number> = {
  "Uno AID8C51": 305483,
  "Strada Simples QPS9I59": 181740,
  "Strada CD AZL5B65": 126550,
  "Strada Endurance SDP4I02": 76000
};

const OIL_REFERENCES = [
  { vehicle: "Uno AID8C51", km: "310.483" },
  { vehicle: "Strada Simples QPS9I59", km: "186.740" },
  { vehicle: "Strada CD AZL5B65", km: "131.550" },
  { vehicle: "Strada Endurance SDP4I02", km: "74.123" }
];

const TRIP_REASONS = [
  "Orçamentos de Obra",
  "Transporte Colaboradores",
  "Transporte Ferramentas",
  "Transporte Materiais"
];

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<{ sheetConnected: boolean, scriptUrl?: string } | null>(null);
  const [showDestinoError, setShowDestinoError] = useState(false);
  const [kmError, setKmError] = useState(false);
  const [kmChegadaError, setKmChegadaError] = useState(false);

  // Auth State
  const [user, setUser] = useState<{ name: string, email: string, picture?: string } | null>(() => {
    const saved = localStorage.getItem('cetec_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const decoded = jwtDecode<{ name: string, email: string, picture: string }>(credentialResponse.credential);
        const userData = { name: decoded.name, email: decoded.email, picture: decoded.picture };
        setUser(userData);
        localStorage.setItem('cetec_user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Login decode error", e);
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('cetec_user');
    setStep(1);
  };

  // Get current date in YYYY-MM-DD format safely
  const getToday = () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  };

  // Image Compression Helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimension
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const formatDateToBR = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const checkCNH = (driverName: string) => {
    if (!driverName) return { valid: false, text: "" };
    const exp = DRIVER_EXPIRATIONS[driverName];
    if (!exp) return { valid: false, text: "DADOS DE CNH NÃO ENCONTRADOS" };

    const expDate = new Date(exp + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expDate >= today) {
      return { valid: true, text: "CNH VÁLIDA, AUTORIZADO DIRIGIR" };
    } else {
      return { valid: false, text: "CNH VENCIDA, NÃO AUTORIZADO DIRIGIR" };
    }
  };

  const [formData, setFormData] = useState({
    cnh_valida: "Sim",
    motorista: "",
    veiculo: "",
    checklist: [] as string[],
    troca_oleo: "",
    motivo: "",
    local_saida: "Escritório",
    local_destino: "",
    data_saida: getToday(),
    hora_saida: "",
    km_saida: "",
    data_retorno: getToday(),
    hora_retorno: "",
    km_chegada: "",
    avaria: "Não",
    fotos: [] as string[],
  });

  const [fuelingData, setFuelingData] = useState({
    veiculo: "",
    km: "",
    litros: ""
  });
  const [fuelingLoading, setFuelingLoading] = useState(false);
  const [fuelingSuccess, setFuelingSuccess] = useState(false);
  const [fuelingKmError, setFuelingKmError] = useState(false);
  const [fuelingAvgError, setFuelingAvgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localLastKm, setLocalLastKm] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cetec_last_km');
      if (saved) return { ...LAST_KM_RECORDS, ...JSON.parse(saved) };
    } catch { }
    return LAST_KM_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('cetec_last_km', JSON.stringify(localLastKm));
  }, [localLastKm]);

  // Sincroniza KMs globais da frota pela API ao abrir o App
  useEffect(() => {
    fetch("/api/kms")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setLocalLastKm(prev => ({ ...prev, ...data.data }));
        }
      })
      .catch(console.error);
  }, []);

  const handleFuelingSubmit = async () => {
    if (!fuelingData.veiculo || !fuelingData.km || !fuelingData.litros) {
      alert("Por favor, preencha todos os campos: Veículo, KM e Litros.");
      return;
    }

    const rawKm = fuelingData.km.trim().toLowerCase();
    const isInitialSet = rawKm.endsWith('a');
    const cleanKmStr = isInitialSet ? rawKm.slice(0, -1) : rawKm;
    const currentKm = parseFloat(cleanKmStr);

    if (isNaN(currentKm)) {
      alert("KM inválido. Por favor, insira apenas números (ex: 76100) ou use 'a' no final para definir o início (ex: 76100a).");
      return;
    }

    const lastKm = localLastKm[fuelingData.veiculo] || 0;

    // Só valida se NÃO for o comando de "memorizar primeiro abastecimento" (sufixo 'a')
    if (!isInitialSet && currentKm < lastKm) {
      setFuelingKmError(true);
      return;
    }

    // Validação de média (máximo 15km/lt)
    const liters = parseFloat(fuelingData.litros);
    if (!isInitialSet && lastKm > 0 && liters > 0) {
      const kmTraveled = currentKm - lastKm;
      const average = kmTraveled / liters;
      if (average > 15) {
        setFuelingAvgError(true);
        return;
      }
    }

    setFuelingKmError(false);
    setFuelingAvgError(false);
    setFuelingLoading(true);
    setFuelingSuccess(false);
    try {
      if (!status?.scriptUrl) {
        throw new Error("URL do Google Script não configurada.");
      }
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fuelingData,
          type: "abastecimento",
          km: cleanKmStr,
          data: formatDateToBR(getToday()),
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na API de abastecimento.");
      }

      // Local update assumption on no-cors
      setLocalLastKm(prev => ({
        ...prev,
        [fuelingData.veiculo]: currentKm
      }));

      setFuelingSuccess(true);
      setFuelingData({ veiculo: "", km: "", litros: "" });
      setTimeout(() => setFuelingSuccess(false), 5000);
    } catch (error: any) {
      alert("Falha no envio: " + error.message);
    } finally {
      setFuelingLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ sheetConnected: false }));
  }, []);

  // Auto-update troca_oleo status based on KM
  useEffect(() => {
    const ref = OIL_REFERENCES.find(r => r.vehicle === formData.veiculo);
    if (ref && formData.km_saida) {
      const nextKm = parseFloat(ref.km.replace(/\./g, ''));
      const currentKm = parseFloat(formData.km_saida);
      const isUrgent = !isNaN(nextKm) && currentKm > nextKm;

      setFormData(prev => ({
        ...prev,
        troca_oleo: isUrgent ? "TROCA URGENTE - USAR VALE CARD" : "OK - AGUARDAR"
      }));
    } else {
      setFormData(prev => ({ ...prev, troca_oleo: "" }));
    }
  }, [formData.veiculo, formData.km_saida]);

  const handleChecklist = (item: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.includes(item)
        ? prev.checklist.filter(i => i !== item)
        : [...prev.checklist, item]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - formData.fotos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(async (file: File) => {
      try {
        const base64String = await compressImage(file);
        setFormData(prev => ({
          ...prev,
          fotos: [...prev.fotos, base64String]
        }));
      } catch (error) {
        console.error("Erro ao comprimir imagem:", error);
      }
    });
  };

  const removeFoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const handleFinalSubmit = async () => {
    const rawKmSaida = formData.km_saida.trim().toLowerCase();
    const isInitialSetSaida = rawKmSaida.endsWith('a');
    const cleanKmSaidaStr = isInitialSetSaida ? rawKmSaida.slice(0, -1) : rawKmSaida;
    const kmSaida = parseFloat(cleanKmSaidaStr.replace(/\./g, '') || "0");

    const rawKmChegada = formData.km_chegada.trim().toLowerCase();
    const isInitialSetChegada = rawKmChegada.endsWith('a');
    const cleanKmChegadaStr = isInitialSetChegada ? rawKmChegada.slice(0, -1) : rawKmChegada;
    const kmChegada = parseFloat(cleanKmChegadaStr.replace(/\./g, '') || "0");

    if (!formData.hora_retorno || !formData.km_chegada) {
      alert("Por favor, preencha a Hora de Retorno e o KM de Chegada.");
      return;
    }

    if (!isInitialSetChegada && kmChegada < kmSaida) {
      setKmChegadaError(true);
      return;
    }

    setKmChegadaError(false);
    setLoading(true);
    try {
      if (!status?.scriptUrl) {
        throw new Error("URL do Google Script não configurada.");
      }

      const dataToSubmit = {
        ...formData,
        km_saida: cleanKmSaidaStr,
        km_chegada: cleanKmChegadaStr,
        data_saida: formatDateToBR(formData.data_saida),
        data_retorno: formatDateToBR(formData.data_retorno),
        type: "viagem"
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error("Erro na API.");
      }

      setLocalLastKm(prev => ({
        ...prev,
        [formData.veiculo]: kmChegada
      }));

      setSuccess(true);
    } catch (error) {
      alert("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      // Validação de KM
      const rawKm = formData.km_saida.trim().toLowerCase();
      const isInitialSet = rawKm.endsWith('a');
      const cleanKmStr = isInitialSet ? rawKm.slice(0, -1) : rawKm;
      const currentKm = parseFloat(cleanKmStr.replace(/\./g, '') || "0");

      const lastKm = localLastKm[formData.veiculo] || 0;

      if (formData.km_saida && isNaN(currentKm)) {
        alert("KM de Saída inválido. Insira números ou use 'a' no final (ex: 700a).");
        return;
      }

      if (formData.km_saida && !isInitialSet && currentKm < lastKm) {
        setKmError(true);
        return;
      }
    }
    if (step === 3) {
      // Validação simples de Local Destino (apenas não pode ser vazio)
      if (!formData.local_destino.trim()) {
        setShowDestinoError(true);
        return;
      }
    }
    setShowDestinoError(false);
    setStep(s => Math.min(s + 1, 4));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border-2 border-[#FFD700] rounded-3xl p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,255,255,0.15)]">
            <CheckCircle2 className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Enviado com Sucesso!</h1>
          <p className="text-zinc-400 mb-8">As informações foram gravadas diretamente na sua planilha do Google.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#e6c200] transition-transform active:scale-95"
          >
            Novo Registro
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-[#FFD700] selection:text-black">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-white p-6 rounded-3xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <img src="/logo.png" alt="CETEC Engenharia" className="w-32 sm:w-40 h-auto" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full text-center space-y-6">
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Acesso Restrito</h1>
              <p className="text-sm text-zinc-400">Faça login com a sua conta Google para acessar o aplicativo da frota.</p>
            </div>

            <div className="flex justify-center pt-2">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.error('Falha no login do Google')}
                theme="filled_black"
                shape="pill"
                size="large"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FFD700] selection:text-black">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="bg-white px-2 py-1.5 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="CETEC" className="h-7 w-auto" />
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Passo {step} de 4</p>
              <div className="w-24 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#FFD700]"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#FFD700] transition-colors overflow-hidden"
              title="Sair da Conta"
            >
              {user?.picture ? (
                <img src={user.picture} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 pb-40">
        {status && !status.sheetConnected && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/50 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-bold">Configuração Pendente</p>
              <p className="opacity-80">O app ainda não está conectado à planilha. Cole a URL do Google Script nos Segredos do AI Studio com o nome <b>GOOGLE_SCRIPT_URL</b>.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            {/* Módulo de Abastecimento Independente */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Módulo de Abastecimento</h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={fuelingData.veiculo}
                    onChange={e => {
                      setFuelingData({ ...fuelingData, veiculo: e.target.value });
                      setFuelingKmError(false); // Limpa o erro ao trocar de veículo
                      setFuelingAvgError(false);
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o Veículo</option>
                    {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="KM Abastecimento"
                      value={fuelingData.km}
                      onChange={e => {
                        setFuelingData({ ...fuelingData, km: e.target.value });
                        setFuelingKmError(false);
                        setFuelingAvgError(false);
                      }}
                      className={cn(
                        "w-full bg-black border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                        (fuelingKmError || fuelingAvgError) ? "border-red-500" : "border-zinc-800"
                      )}
                    />
                    {fuelingKmError && (
                      <p className="text-red-500 font-bold text-[10px] uppercase leading-tight">
                        KM INFERIOR AO ÚLTIMO INFORMADO ({localLastKm[fuelingData.veiculo]?.toLocaleString('pt-BR')})
                      </p>
                    )}
                    {fuelingAvgError && (
                      <p className="text-red-500 font-bold text-[10px] uppercase leading-tight">
                        MÉDIA INVÁLIDA: ULTRAPASSOU 15 KM/LT. VERIFIQUE KM E LITROS.
                      </p>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Litros"
                    value={fuelingData.litros}
                    onChange={e => {
                      setFuelingData({ ...fuelingData, litros: e.target.value });
                      setFuelingAvgError(false);
                    }}
                    className={cn(
                      "w-full bg-black border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all h-fit",
                      fuelingAvgError ? "border-red-500" : "border-zinc-800"
                    )}
                  />
                </div>
                <button
                  onClick={handleFuelingSubmit}
                  disabled={fuelingLoading || !fuelingData.veiculo || !fuelingData.km || !fuelingData.litros}
                  className="w-full py-2.5 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#e6c200] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {fuelingLoading ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar Abastecimento</>}
                </button>
                {fuelingSuccess && (
                  <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-xs animate-bounce mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    ENVIADO COM SUCESSO!
                  </div>
                )}
              </div>
            </div>

            {/* Módulo de Viagem - Identificação */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#FFD700]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Módulo de Viagem</h2>
              </div>

              <div className="p-5 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white">
                    <User className="w-5 h-5 text-[#FFD700]" /> Identificação
                  </h2>
                  <p className="text-zinc-500 text-[11px]">Quem está conduzindo o veículo hoje?</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Motorista</label>
                    <select
                      value={formData.motorista}
                      onChange={e => {
                        const name = e.target.value;
                        const status = checkCNH(name);
                        setFormData({
                          ...formData,
                          motorista: name,
                          cnh_valida: status.text ? (status.valid ? "Sim" : "Não") : ""
                        });
                      }}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione o motorista</option>
                      {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Status da CNH</label>
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 min-h-[56px] flex items-center justify-center">
                      {formData.motorista ? (
                        (() => {
                          const status = checkCNH(formData.motorista);
                          return (
                            <p className={cn(
                              "font-bold text-center uppercase text-[10px] tracking-widest",
                              status.valid ? "text-emerald-500" : "text-red-500"
                            )}>
                              {status.text}
                            </p>
                          );
                        })()
                      ) : (
                        <p className="text-zinc-600 text-[10px] italic uppercase tracking-tighter">Selecione um motorista</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                    <div className="space-y-1">
                      <h3 className="text-[#FFD700] font-black text-[9px] uppercase tracking-widest">Foco no Cuidado com o Veículo</h3>
                      <div className="h-0.5 w-8 bg-[#FFD700] rounded-full"></div>
                    </div>
                    <div className="space-y-1.5 italic text-[10px] text-[#FFD700]/70 font-medium leading-tight">
                      <p>"Este carro é sua ferramenta de trabalho; cuide dele como cuida do seu futuro."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Módulo de Viagem</h2>
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white">
                  <Truck className="w-5 h-5 text-[#FFD700]" /> Veículo &amp; Checklist
                </h2>
                <p className="text-zinc-500 text-[11px]">Verifique as condições básicas de segurança.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Modelo e Placa</label>
                <select
                  value={formData.veiculo}
                  onChange={e => setFormData({ ...formData, veiculo: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                >
                  <option value="">Selecione o veículo</option>
                  {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Checklist Pré-Viagem</label>
                <div className="grid grid-cols-1 gap-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleChecklist(item)}
                      className={cn(
                        "w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left",
                        formData.checklist.includes(item)
                          ? "bg-zinc-800 border-[#FFD700] text-white"
                          : "bg-black border-zinc-800 text-zinc-500"
                      )}
                    >
                      {formData.checklist.includes(item) ? (
                        <CheckSquare className="w-4 h-4 text-[#FFD700]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                      <Calendar className="w-4 h-4 text-[#FFD700]" /> Data Saída
                    </label>
                    <input
                      type="date"
                      value={formData.data_saida}
                      onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                      <Clock className="w-4 h-4 text-[#FFD700]" /> Hora Saída
                    </label>
                    <input
                      type="time"
                      value={formData.hora_saida}
                      onChange={e => setFormData({ ...formData, hora_saida: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                    <MapPin className="w-4 h-4 text-[#FFD700]" /> KM Saída
                  </label>
                  <input
                    type="number"
                    placeholder="000000"
                    value={formData.km_saida}
                    onChange={e => {
                      setFormData({ ...formData, km_saida: e.target.value });
                      setKmError(false);
                    }}
                    className={cn(
                      "w-full bg-black border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                      kmError ? "border-red-500" : "border-zinc-800"
                    )}
                  />
                  {kmError && (
                    <p className="text-red-500 font-bold text-[9px] uppercase tracking-tighter">
                      KM INCORRETO: MENOR QUE O ÚLTIMO REGISTRO ({localLastKm[formData.veiculo]?.toLocaleString('pt-BR')})
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Troca de Óleo</label>
                {formData.veiculo ? (
                  <div className="bg-black border border-zinc-800 rounded-xl p-4">
                    <p className="text-[9px] font-bold text-[#FFD700] uppercase tracking-widest mb-3">Próxima Troca:</p>
                    <div className="space-y-3">
                      {OIL_REFERENCES.filter(ref => ref.vehicle === formData.veiculo).map(ref => {
                        const nextKmStr = (ref.km || "").toString().replace(/\./g, '');
                        const nextKm = parseFloat(nextKmStr);
                        const currentKm = parseFloat(formData.km_saida || "0");
                        const hasAlert = !isNaN(nextKm) && formData.km_saida !== "";
                        const isUrgent = hasAlert && currentKm > nextKm;
                        return (
                          <div key={ref.vehicle} className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-400 font-medium">{ref.vehicle}</span>
                              <span className="text-white font-bold">KM {ref.km}</span>
                            </div>
                            {hasAlert && (
                              <div className={cn(
                                "text-[9px] font-black uppercase tracking-widest p-2 rounded-lg text-center",
                                isUrgent ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              )}>
                                {isUrgent ? "TROCA DE ÓLEO URGENTE" : "OK - AGUARDAR"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Selecione o veículo</p>
                  </div>
                )}
                {(() => {
                  const ref = OIL_REFERENCES.find(r => r.vehicle === formData.veiculo);
                  if (!ref || !formData.km_saida) return null;
                  const nextKm = parseFloat(ref.km.replace(/\./g, ''));
                  const currentKm = parseFloat(formData.km_saida);
                  const isUrgent = !isNaN(nextKm) && currentKm > nextKm;

                  if (isUrgent) {
                    return (
                      <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 p-3 rounded-xl">
                        <p className="text-[#FFD700] font-black text-[10px] text-center leading-tight uppercase tracking-wide">
                          USAR CARTÃO VALE CARD PARA TROCA ÓLEO E FILTRO
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Módulo de Viagem</h2>
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white">
                  <Navigation className="w-5 h-5 text-[#FFD700]" /> Detalhes da Viagem
                </h2>
                <p className="text-zinc-500 text-[11px]">Para onde vamos e qual o motivo?</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Motivo da Viagem</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TRIP_REASONS.map(reason => {
                      const isSelected = formData.motivo.split(', ').includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            const currentReasons = formData.motivo ? formData.motivo.split(', ') : [];
                            const newReasons = isSelected
                              ? currentReasons.filter(r => r !== reason)
                              : [...currentReasons, reason];
                            setFormData({ ...formData, motivo: newReasons.join(', ') });
                          }}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left text-xs font-medium",
                            isSelected
                              ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]"
                              : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-[#FFD700] border-[#FFD700]" : "border-zinc-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[4]" />}
                          </div>
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Outro motivo..."
                    value={formData.motivo.split(', ').filter(r => !TRIP_REASONS.includes(r)).join(', ')}
                    onChange={e => {
                      const predefined = formData.motivo.split(', ').filter(r => TRIP_REASONS.includes(r));
                      const other = e.target.value;
                      const combined = [...predefined, other].filter(Boolean).join(', ');
                      setFormData({ ...formData, motivo: combined });
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Local Saída</label>
                    <input
                      type="text"
                      value={formData.local_saida}
                      onChange={e => setFormData({ ...formData, local_saida: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Local Destino</label>
                    <input
                      type="text"
                      placeholder="Cód. Obra / Cidade"
                      value={formData.local_destino}
                      onChange={e => {
                        setFormData({ ...formData, local_destino: e.target.value });
                        setShowDestinoError(false);
                      }}
                      className={cn(
                        "w-full bg-black border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                        showDestinoError ? "border-red-500" : "border-zinc-800"
                      )}
                    />
                    {showDestinoError && (
                      <p className="text-red-500 font-bold text-[9px] uppercase tracking-widest">FAVOR PREENCHER CÓDIGO DA OBRA</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Módulo de Viagem</h2>
            </div>

            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#FFD700]" /> Retorno & Avarias
                </h2>
                <p className="text-zinc-500 text-[11px]">Finalize o registro da sua viagem.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                      <Calendar className="w-4 h-4 text-[#FFD700]" /> Data Retorno
                    </label>
                    <input
                      type="date"
                      value={formData.data_retorno}
                      onChange={e => setFormData({ ...formData, data_retorno: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                      <Clock className="w-4 h-4 text-[#FFD700]" /> Hora Chegada
                    </label>
                    <input
                      type="time"
                      value={formData.hora_retorno}
                      onChange={e => setFormData({ ...formData, hora_retorno: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                    <MapPin className="w-4 h-4 text-[#FFD700]" /> KM Chegada
                  </label>
                  <input
                    type="number"
                    placeholder="000000"
                    value={formData.km_chegada}
                    onChange={e => {
                      setFormData({ ...formData, km_chegada: e.target.value });
                      setKmChegadaError(false);
                    }}
                    className={cn(
                      "w-full bg-black border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                      kmChegadaError ? "border-red-500" : "border-zinc-800"
                    )}
                  />
                  {kmChegadaError && (
                    <p className="text-red-500 font-bold text-[9px] uppercase tracking-tighter">
                      KM DE CHEGADA NÃO PODE SER MENOR QUE O DE SAÍDA ({parseFloat(formData.km_saida).toLocaleString('pt-BR')})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                    <AlertTriangle className="w-4 h-4 text-[#FFD700]" /> Avarias Identificadas?
                  </label>
                  <textarea
                    placeholder="Descreva qualquer problema ou 'Não' se estiver tudo ok."
                    value={formData.avaria}
                    onChange={e => setFormData({ ...formData, avaria: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                    <Camera className="w-4 h-4 text-[#FFD700]" /> Fotos (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center hover:border-[#FFD700] transition-colors cursor-pointer group bg-black"
                  >
                    <Camera className="w-8 h-8 text-zinc-700 mx-auto mb-2 group-hover:text-[#FFD700] transition-colors" />
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Toque para tirar até 5 fotos</p>
                  </div>

                  {formData.fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {formData.fotos.map((foto, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 group">
                          <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFoto(idx);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-800 p-6">
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" /> Voltar
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 && !formData.motorista}
                  className="flex-[2] py-3 bg-[#FFD700] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6c200] transition-transform active:scale-95 disabled:opacity-50"
                >
                  Próximo <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || (status && !status.sheetConnected)}
                  className="flex-[2] py-3 bg-[#FFD700] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6c200] transition-transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Enviando..." : (
                    <>Finalizar e Enviar <Send className="w-5 h-5" /></>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              {status?.sheetConnected ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                  <Link2 className="w-3 h-3" /> Ligação Direta Ativa
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <Unlink className="w-3 h-3" /> Conexão Pendente
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
