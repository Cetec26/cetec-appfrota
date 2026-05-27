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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isSameVehicle = (a: string, b: string) => {
  if (!a || !b) return false;
  if (a === b) return true;
  // Tenta extrair a placa (formato antigo ou Mercosul)
  const placaA = a.match(/[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}/i);
  const placaB = b.match(/[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}/i);
  if (placaA && placaB) {
    const limpaA = placaA[0].toUpperCase().replace('-', '');
    const limpaB = placaB[0].toUpperCase().replace('-', '');
    if (limpaA === limpaB) return true;
  }
  // Se não tem placa ou não bateu, tenta por substring
  return a.includes(b) || b.includes(a);
};

const INITIAL_DRIVERS = [
  "Alexsandro Felipe Demétrio",
  "André Luis de Andrade",
  "Eugênia Cristina de Camargo",
  "Gustavo Oliveira de Medeiros",
  "Hermes Augusto Martineli Martini",
  "Laércio Andreiov da Silva",
  "Michael Jones da Silva de Camargo",
  "Patrícia Aline Collebrusco Cardoso de Camargo",
  "Pedro Villar (Mecânico)",
  "Raul Bonfim dos Santos"
].sort();

const INITIAL_DRIVER_EXPIRATIONS: Record<string, string> = {
  "Alexsandro Felipe Demétrio": "2031-09-30",
  "André Luis de Andrade": "2033-05-08",
  "Eugênia Cristina de Camargo": "2035-01-01",
  "Gustavo Oliveira de Medeiros": "2035-01-14",
  "Hermes Augusto Martineli Martini": "2036-01-05",
  "Laércio Andreiov da Silva": "2032-09-13",
  "Michael Jones da Silva de Camargo": "2034-04-17",
  "Patrícia Aline Collebrusco Cardoso de Camargo": "2036-02-19",
  "Pedro Villar (Mecânico)": "2035-01-01",
  "Raul Bonfim dos Santos": "2035-01-21"
};

const VEHICLES = [
  "Uno Branco AID8C51",
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
  "Uno Branco AID8C51": 304978,
  "Strada Simples QPS9I59": 184528,
  "Strada CD AZL5B65": 132455,
  "Strada Endurance SDP4I02": 75752
};

const INITIAL_OIL_REFERENCES = [
  { vehicle: "Uno Branco AID8C51", km: "310.483" },
  { vehicle: "Strada Simples QPS9I59", km: "186.740" },
  { vehicle: "Strada CD AZL5B65", km: "141.949" },
  { vehicle: "Strada Endurance SDP4I02", km: "83.896" }
];

const TRIP_REASONS = [
  "Orçamentos de Obra",
  "Transporte Colaboradores",
  "Transporte Ferramentas",
  "Transporte Materiais"
];

export default function App() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<{ sheetConnected: boolean, scriptUrl?: string } | null>(null);
  const [showDestinoError, setShowDestinoError] = useState(false);
  const [kmError, setKmError] = useState(false);
  const [kmChegadaError, setKmChegadaError] = useState(false);

  const [driversList, setDriversList] = useState<string[]>(INITIAL_DRIVERS);

  const [vehiclesList, setVehiclesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cetec_vehicles_list');
      if (saved) return JSON.parse(saved);
    } catch { }
    return VEHICLES;
  });

  const [driverExpirations, setDriverExpirations] = useState<Record<string, string>>(INITIAL_DRIVER_EXPIRATIONS);

  const [oilReferences, setOilReferences] = useState<{vehicle: string, km: string}[]>(() => {
    try {
      const saved = localStorage.getItem('cetec_oil_refs');
      if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_OIL_REFERENCES;
  });

  // Removed Auth State

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

  const checkCNH = (driverName: string, customExps?: Record<string, string>) => {
    if (!driverName) return { valid: false, text: "" };
    const expsObj = customExps || driverExpirations;
    const exp = expsObj[driverName];
    if (!exp) return { valid: false, text: "DADOS DE CNH NÃO ENCONTRADOS" };

    let expDate;
    if (exp.includes('/')) {
      const parts = exp.split('/');
      // Assume DD/MM/YYYY format if it has slashes
      expDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    } else if (exp.includes('T')) {
      expDate = new Date(exp);
    } else {
      expDate = new Date(exp + "T00:00:00");
    }

    if (isNaN(expDate.getTime())) {
      return { valid: false, text: "ERRO DE DATA DE CNH" };
    }

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
    motorista: "",
    veiculo: "",
    km: "",
    litros: ""
  });
  const [fuelingLoading, setFuelingLoading] = useState(false);
  const [fuelingSuccess, setFuelingSuccess] = useState(false);
  const [fuelingKmError, setFuelingKmError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localLastKm, setLocalLastKm] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cetec_last_km');
      if (saved) return { ...LAST_KM_RECORDS, ...JSON.parse(saved) };
    } catch { }
    return LAST_KM_RECORDS;
  });

  const [vehicleStatus, setVehicleStatus] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cetec_vehicle_status');
      let parsed = saved ? JSON.parse(saved) : {};
      // PATCH: Forçar AZL5B65 para 'em_viagem' caso o patch ainda não tenha sido aplicado
      if (!localStorage.getItem('patch_azl5b65_status_applied')) {
        parsed['Strada CD AZL5B65'] = 'em_viagem';
        localStorage.setItem('patch_azl5b65_status_applied', 'true');
      }
      // PATCH: Forçar Strada Simples QPS9I59 para 'em_viagem' caso o patch ainda não tenha sido aplicado
      if (!localStorage.getItem('patch_qps9i59_status_applied')) {
        parsed['Strada Simples QPS9I59'] = 'em_viagem';
        localStorage.setItem('patch_qps9i59_status_applied', 'true');
      }
      // PATCH: Forçar Strada Endurance SDP4I02 para 'em_viagem'
      if (!localStorage.getItem('patch_sdp4i02_status_applied_v1')) {
        parsed['Strada Endurance SDP4I02'] = 'em_viagem';
        localStorage.setItem('patch_sdp4i02_status_applied_v1', 'true');
      }
      // PATCH: Forçar AZL5B65 para 'disponivel' para corrigir bug de retorno travado
      if (!localStorage.getItem('patch_azl5b65_status_disponivel_v1')) {
        parsed['Strada CD AZL5B65'] = 'disponivel';
        localStorage.setItem('patch_azl5b65_status_disponivel_v1', 'true');
      }
      
      // NOVO PATCH: Forçar Strada Simples QPS9I59 para 'em_viagem' a pedido do usuário
      if (!localStorage.getItem('patch_qps9i59_status_em_viagem_v3')) {
        parsed['Strada Simples QPS9I59'] = 'em_viagem';
        localStorage.setItem('patch_qps9i59_status_em_viagem_v3', 'true');
      }
      // NOVO PATCH: Forçar Strada Endurance SDP4I02 para 'em_viagem' a pedido do usuário
      if (!localStorage.getItem('patch_sdp4i02_status_em_viagem_v3')) {
        parsed['Strada Endurance SDP4I02'] = 'em_viagem';
        localStorage.setItem('patch_sdp4i02_status_em_viagem_v3', 'true');
      }

      return parsed;
    } catch { }
    return { 
      'Strada CD AZL5B65': 'em_viagem',
      'Strada Simples QPS9I59': 'em_viagem',
      'Strada Endurance SDP4I02': 'em_viagem'
    };
  });

  const [vehicleDrivers, setVehicleDrivers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cetec_vehicle_drivers');
      let parsed = saved ? JSON.parse(saved) : {};
      // PATCH: Definir Gustavo como motorista deste veículo caso o patch ainda não tenha sido aplicado
      if (!localStorage.getItem('patch_azl5b65_driver_applied')) {
        parsed['Strada CD AZL5B65'] = 'Gustavo Oliveira de Medeiros';
        localStorage.setItem('patch_azl5b65_driver_applied', 'true');
      }
      // PATCH: Definir Raul como motorista deste veículo caso o patch ainda não tenha sido aplicado
      if (!localStorage.getItem('patch_qps9i59_driver_applied')) {
        parsed['Strada Simples QPS9I59'] = 'Raul Bonfim dos Santos';
        localStorage.setItem('patch_qps9i59_driver_applied', 'true');
      }
      // PATCH: Definir Alexsandro para a Strada Endurance
      if (!localStorage.getItem('patch_sdp4i02_driver_applied_v1')) {
        parsed['Strada Endurance SDP4I02'] = 'Alexsandro Felipe Demétrio';
        localStorage.setItem('patch_sdp4i02_driver_applied_v1', 'true');
      }
      return parsed;
    } catch { }
    return { 
      'Strada CD AZL5B65': 'Gustavo Oliveira de Medeiros',
      'Strada Simples QPS9I59': 'Raul Bonfim dos Santos',
      'Strada Endurance SDP4I02': 'Alexsandro Felipe Demétrio'
    };
  });

  const activeFormMode = formData.veiculo && vehicleStatus[formData.veiculo] === 'em_viagem' ? 'chegada' : 'saida';

  // Removed Google Redirect Login Callback

  useEffect(() => {
    localStorage.setItem('cetec_last_km', JSON.stringify(localLastKm));
  }, [localLastKm]);

  useEffect(() => {
    localStorage.setItem('cetec_vehicle_status', JSON.stringify(vehicleStatus));
  }, [vehicleStatus]);

  useEffect(() => {
    localStorage.setItem('cetec_vehicle_drivers', JSON.stringify(vehicleDrivers));
  }, [vehicleDrivers]);

  // Sincroniza KMs globais da frota pela API ao abrir o App
  useEffect(() => {
    fetch("/api/kms")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setLocalLastKm(prev => ({ ...prev, ...data.data }));
        }
        if (data && data.success && data.status) {
          // OVERRIDE FORÇADO PELA API: Ignorar retorno do script se a flag não foi marcada como false
          if (localStorage.getItem('force_viagem_qps9i59_v4') !== 'false') {
            data.status['Strada Simples QPS9I59'] = 'em_viagem';
          }
          if (localStorage.getItem('force_viagem_sdp4i02_v4') !== 'false') {
            data.status['Strada Endurance SDP4I02'] = 'em_viagem';
          }

          setVehicleStatus(data.status);
          localStorage.setItem('cetec_vehicle_status', JSON.stringify(data.status));
        }
      })
      .catch(console.error);

    fetch("/api/drivers")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          const expirations = data.data;
          const validNames = Object.keys(expirations).filter(n => n.trim() !== "").sort();
          if (validNames.length > 0) {
            setDriverExpirations(expirations);
            setDriversList(validNames);
            localStorage.setItem('cetec_driver_expirations', JSON.stringify(expirations));
            localStorage.setItem('cetec_drivers_list', JSON.stringify(validNames));

            setFormData(prev => {
              if (!prev.motorista) return prev;
              const status = checkCNH(prev.motorista, expirations);
              return { ...prev, cnh_valida: status.text ? (status.valid ? "Sim" : "Não") : "" };
            });
          }
        }
      })
      .catch(console.error);

    fetch("/api/oil")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setOilReferences(data.data);
          localStorage.setItem('cetec_oil_refs', JSON.stringify(data.data));
        }
      })
      .catch(console.error);

    fetch("/api/vehicles")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setVehiclesList(data.data);
          localStorage.setItem('cetec_vehicles_list', JSON.stringify(data.data));
        }
      })
      .catch(console.error);
  }, []);

  const handleFuelingSubmit = async () => {
    if (!fuelingData.motorista || !fuelingData.veiculo || !fuelingData.km || !fuelingData.litros) {
      alert("Por favor, preencha todos os campos: Motorista, Veículo, KM e Litros.");
      return;
    }

    const kmForTest = fuelingData.km.trim().replace(/\./g, '');
    if (!/^\d+$/.test(kmForTest)) {
      alert("KM inválido. Por favor, insira apenas números.");
      return;
    }

    setFuelingKmError(false);
    setFuelingLoading(true);
    setFuelingSuccess(false);
    try {
      const response = await fetch("/api/fueling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fuelingData,
          type: "abastecimento",
          usuario_logado: "Usuário",
          email_logado: "usuario@cetec.com",
          data: formatDateToBR(getToday()),
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          tanque_cheio: "SIM"
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Erro na API de abastecimento.");
      }

      setFuelingSuccess(true);
      setFuelingData({ motorista: "", veiculo: "", km: "", litros: "" });
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

  useEffect(() => {
    const ref = oilReferences.find(r => isSameVehicle(r.vehicle, formData.veiculo));
    if (ref && formData.km_saida) {
      const nextKmStr = (ref.km || "").toString().replace(/\./g, '');
      const nextKm = parseFloat(nextKmStr);
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


  const handleSaidaSubmit = async () => {
    if (formData.motorista) {
      const cnhStatus = checkCNH(formData.motorista);
      if (!cnhStatus.valid) {
        alert("Sua CNH está vencida. Você não está autorizado a dirigir.");
        return;
      }
    } else {
      alert("Por favor, selecione um Motorista.");
      return;
    }

    if (!formData.veiculo) {
      alert("Por favor, selecione o Veículo.");
      return;
    }

    if (!formData.km_saida.trim()) {
      alert("Por favor, preencha o KM de Saída.");
      return;
    }

    const rawKmSaida = formData.km_saida.trim().toLowerCase();
    const isInitialSetSaida = rawKmSaida === 'zerar' || rawKmSaida.includes('zerar');
    const cleanKmSaidaStr = isInitialSetSaida ? rawKmSaida.replace('zerar', '').trim() || "0" : rawKmSaida;
    const kmSaida = parseFloat(cleanKmSaidaStr.replace(/\./g, '') || "0");

    const lastKm = localLastKm[formData.veiculo] || 0;

    const kmSaidaForTest = cleanKmSaidaStr.replace(/\./g, '');
    if (!/^\d+$/.test(kmSaidaForTest)) {
      alert("Não permitido letras, apenas números");
      return;
    }

    if (!isInitialSetSaida && kmSaida < lastKm) {
      setKmError(true);
      alert(`O KM de Saída não pode ser menor que o último registro (${lastKm.toLocaleString('pt-BR')}).`);
      return;
    }

    if (!formData.local_destino.trim()) {
      setShowDestinoError(true);
      alert("Por favor, preencha o Código da Obra / Local de Destino.");
      return;
    }

    setKmError(false);
    setShowDestinoError(false);

    setLoading(true);
    try {
      if (!status?.scriptUrl) {
        throw new Error("URL do Google Script não configurada.");
      }

      const dataToSubmit = {
        data_saida: formatDateToBR(formData.data_saida),
        hora_saida: formData.hora_saida,
        motorista: formData.motorista,
        veiculo: formData.veiculo,
        km_saida: cleanKmSaidaStr,
        local_saida: formData.local_saida,
        local_destino: formData.local_destino,
        checklist: Array.isArray(formData.checklist) ? formData.checklist : [],
        data_chegada: "",
        hora_chegada: "",
        km_chegada: "",
        kms_rodados: "",
        avarias: "",
        fotos: "",
        type: "saida"
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro na API.");
      }

      setLocalLastKm(prev => ({
        ...prev,
        [formData.veiculo]: kmSaida
      }));
      setVehicleStatus(prev => ({
        ...prev,
        [formData.veiculo]: 'em_viagem'
      }));
      setVehicleDrivers(prev => ({
        ...prev,
        [formData.veiculo]: formData.motorista
      }));

      setSuccess(true);
    } catch (error: any) {
      alert("Erro ao conectar ao servidor: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChegadaSubmit = async () => {
    if (!formData.veiculo) {
      alert("Por favor, selecione o Veículo.");
      return;
    }

    const rawKmChegada = formData.km_chegada.trim().toLowerCase();
    const isInitialSetChegada = rawKmChegada === 'zerar' || rawKmChegada.includes('zerar');
    const cleanKmChegadaStr = isInitialSetChegada ? rawKmChegada.replace('zerar', '').trim() || "0" : rawKmChegada;
    const kmChegada = parseFloat(cleanKmChegadaStr.replace(/\./g, '') || "0");

    if (!formData.hora_retorno || !formData.km_chegada) {
      alert("Por favor, preencha a Hora de Retorno e o KM de Chegada para finalizar a viagem.");
      return;
    }

    const kmChegadaForTest = cleanKmChegadaStr.replace(/\./g, '');
    if (!/^\d+$/.test(kmChegadaForTest)) {
      alert("Não permitido letras, apenas números");
      return;
    }

    // Comparamos com o último KM do veículo (que agora é o KM de Saída gravado no estado anterior)
    const lastKm = localLastKm[formData.veiculo] || 0;
    if (!isInitialSetChegada && kmChegada < lastKm) {
      setKmChegadaError(true);
      alert(`O KM de Chegada não pode ser menor que o KM de Saída (${lastKm.toLocaleString('pt-BR')}).`);
      return;
    }

    setKmChegadaError(false);
    setLoading(true);
    try {
      if (!status?.scriptUrl) {
        throw new Error("URL do Google Script não configurada.");
      }

      const kmsRodadosCalculated = isInitialSetChegada ? 0 : (kmChegada - lastKm);

      const dataToSubmit = {
        data_saida: "",
        hora_saida: "",
        motorista: formData.motorista || vehicleDrivers[formData.veiculo] || "",
        veiculo: formData.veiculo,
        km_saida: "",
        local_saida: "",
        local_destino: "",
        checklist: [],
        data_chegada: formatDateToBR(formData.data_retorno),
        hora_chegada: formData.hora_retorno,
        km_chegada: cleanKmChegadaStr,
        kms_rodados: isInitialSetChegada ? "0" : `=INDIRECT("K"&ROW())-INDIRECT("E"&ROW())`,
        avarias: formData.avaria,
        fotos: formData.fotos && formData.fotos.length > 0 ? `Sim (${formData.fotos.length})` : "Não",
        type: "chegada"
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro na API.");
      }

      setLocalLastKm(prev => ({
        ...prev,
        [formData.veiculo]: kmChegada
      }));
      setVehicleStatus(prev => ({
        ...prev,
        [formData.veiculo]: 'disponivel'
      }));

      // Remover o override forçado ao completar a chegada
      if (formData.veiculo === 'Strada Simples QPS9I59') {
        localStorage.setItem('force_viagem_qps9i59_v4', 'false');
      }
      if (formData.veiculo === 'Strada Endurance SDP4I02') {
        localStorage.setItem('force_viagem_sdp4i02_v4', 'false');
      }

      // Limpa formulário após chegada
      setFormData(prev => ({
        ...prev,
        motorista: "", veiculo: "", checklist: [], motivo: "", local_destino: "", km_saida: "", km_chegada: "", avaria: "Não", fotos: []
      }));
      setSuccess(true);
    } catch (error: any) {
      alert("Erro ao conectar ao servidor: " + error.message);
    } finally {
      setLoading(false);
    }
  };


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
              <p className="text-xs text-zinc-500 font-bold tracking-wider uppercase">Registro Único</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden">
              <User className="w-5 h-5" />
            </div>
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
                    value={fuelingData.motorista}
                    onChange={e => {
                      setFuelingData({ ...fuelingData, motorista: e.target.value });
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o Motorista</option>
                    {driversList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={fuelingData.veiculo}
                    onChange={e => {
                      setFuelingData({ ...fuelingData, veiculo: e.target.value });
                      setFuelingKmError(false); // Limpa o erro ao trocar de veículo
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o Veículo</option>
                    {vehiclesList.map(v => <option key={v} value={v}>{v}</option>)}
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
                      }}
                      className={cn(
                        "w-full bg-black border rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                        fuelingKmError ? "border-red-500" : "border-zinc-800"
                      )}
                    />
                    {fuelingKmError && (
                      <p className="text-red-500 font-bold text-[10px] uppercase leading-tight">
                        KM INFERIOR AO ÚLTIMO INFORMADO ({localLastKm[fuelingData.veiculo]?.toLocaleString('pt-BR')})
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      placeholder="Litros"
                      value={fuelingData.litros}
                      onChange={e => setFuelingData({ ...fuelingData, litros: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                    />
                  </div>
                </div>
                
                {/* Troca de Óleo - Abastecimento */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-zinc-400 uppercase tracking-tight">Status do Óleo</label>
                  {fuelingData.veiculo ? (
                    <div className="bg-black border border-zinc-800 rounded-xl p-4">
                      <p className="text-xs font-bold text-[#FFD700] uppercase tracking-widest mb-3">Próxima Troca:</p>
                      <div className="space-y-3">
                        {oilReferences.filter(ref => isSameVehicle(ref.vehicle, fuelingData.veiculo)).map(ref => {
                          const nextKmStr = (ref.km || "").toString().replace(/\./g, '');
                          const nextKm = parseFloat(nextKmStr);
                          const currentKm = parseFloat(fuelingData.km || "0");
                          const hasAlert = !isNaN(nextKm) && fuelingData.km !== "";
                          const isUrgent = hasAlert && currentKm > nextKm;
                          return (
                            <div key={ref.vehicle} className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400 font-medium">{ref.vehicle}</span>
                                <span className="text-white font-black text-lg">KM {ref.km}</span>
                              </div>
                              {hasAlert && (
                                <div className={cn(
                                  "text-xs font-black uppercase tracking-widest p-3 rounded-lg text-center",
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
                      <p className="text-sm text-zinc-600 uppercase tracking-tighter">Selecione o veículo</p>
                    </div>
                  )}
                  {(() => {
                    const ref = oilReferences.find(r => isSameVehicle(r.vehicle, fuelingData.veiculo));
                    if (!ref || !fuelingData.km) return null;
                    const nextKm = parseFloat((ref.km || "").toString().replace(/\./g, ''));
                    const currentKm = parseFloat((fuelingData.km || "").toString().replace(/\./g, ''));
                    const isUrgent = !isNaN(nextKm) && currentKm > nextKm;

                    if (isUrgent) {
                      return (
                        <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 p-4 rounded-xl mb-2">
                          <p className="text-[#FFD700] font-black text-sm text-center leading-tight uppercase tracking-wide">
                            USAR CARTÃO VALE CARD PARA TROCA ÓLEO E FILTRO
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <button
                  onClick={handleFuelingSubmit}
                  disabled={fuelingLoading || !fuelingData.motorista || !fuelingData.veiculo || !fuelingData.km || !fuelingData.litros}
                  className="w-full py-3 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#e6c200] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
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
            {/* Módulo de Viagem - Integrado */}
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
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione o motorista</option>
                      {driversList.map(d => <option key={d} value={d}>{d}</option>)}
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

              {/* Veículo & Checklist */}
              <div className="p-5 space-y-6 border-t border-zinc-800">
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
                    onChange={e => {
                      const selectedVehicle = e.target.value;
                      setFormData({ 
                        ...formData, 
                        veiculo: selectedVehicle,
                        motorista: (vehicleStatus[selectedVehicle] === 'em_viagem' && vehicleDrivers[selectedVehicle]) 
                                   ? vehicleDrivers[selectedVehicle] 
                                   : formData.motorista
                      });
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o veículo</option>
                    {vehiclesList.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {activeFormMode === 'saida' ? (
                  <>
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
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                          <MapPin className="w-4 h-4 text-[#FFD700]" /> Código da Obra / Local de Destino
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Obra 123 ou Cidade X"
                          value={formData.local_destino}
                          onChange={e => {
                            setFormData({ ...formData, local_destino: e.target.value });
                            setShowDestinoError(false);
                          }}
                          className={cn(
                            "w-full bg-black border rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
                            showDestinoError ? "border-red-500" : "border-zinc-800"
                          )}
                        />
                        {showDestinoError && (
                          <p className="text-red-500 font-bold text-[9px] uppercase tracking-tighter">
                            PREENCHIMENTO OBRIGATÓRIO
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                            <Calendar className="w-4 h-4 text-[#FFD700]" /> Data Saída
                          </label>
                          <input
                            type="date"
                            value={formData.data_saida}
                            onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
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
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                          <MapPin className="w-4 h-4 text-[#FFD700]" /> KM Saída
                        </label>
                        <input
                          type="text"
                          placeholder="000000"
                          value={formData.km_saida}
                          onChange={e => {
                            setFormData({ ...formData, km_saida: e.target.value });
                            setKmError(false);
                          }}
                          className={cn(
                            "w-full bg-black border rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
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

                    <div className="pt-4 border-t border-zinc-800">
                      <button
                        onClick={handleSaidaSubmit}
                        disabled={loading || (status && !status.sheetConnected)}
                        className="w-full h-14 bg-[#FFD700] text-black font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:bg-[#e6c200] transition-all active:scale-95 disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500"
                      >
                        {loading ? "Processando..." : (
                          <>Registrar Saída <Send className="w-5 h-5" /></>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  formData.veiculo && (
                    <div className="pt-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl text-center">
                        <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                          Veículo em viagem. <br/> Preencha os dados de chegada abaixo.
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Retorno & Avarias */}
              <div className="p-5 space-y-6 border-t border-zinc-800">
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
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
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
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-tight">
                      <MapPin className="w-4 h-4 text-[#FFD700]" /> KM Chegada
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={formData.km_chegada}
                      onChange={e => {
                        setFormData({ ...formData, km_chegada: e.target.value });
                        setKmChegadaError(false);
                      }}
                      className={cn(
                        "w-full bg-black border rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all",
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
                    <select
                      value={formData.avaria}
                      onChange={e => setFormData({ ...formData, avaria: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 h-14 text-sm focus:ring-2 focus:ring-[#FFD700] outline-none transition-all appearance-none"
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">Sim</option>
                    </select>
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
                
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={handleChegadaSubmit}
                    disabled={loading || (status && !status.sheetConnected) || activeFormMode !== 'chegada'}
                    className="w-full h-14 bg-[#FFD700] text-black font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:bg-[#e6c200] transition-all active:scale-95 disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500"
                  >
                    {loading ? "Processando..." : (
                      <>Registrar Chegada <Send className="w-5 h-5" /></>
                    )}
                  </button>
                  {formData.veiculo && activeFormMode === 'saida' && (
                    <p className="text-zinc-500 font-bold text-[10px] uppercase text-center mt-3 tracking-widest">No pátio. Registre uma saída primeiro.</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
