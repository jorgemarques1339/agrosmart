import React, { useState, useEffect } from 'react';
import { 
  Workflow, Zap, Droplets, Clock, Power, Thermometer, 
  CloudRain, Plus, Trash2, Play, CheckCircle2, X, ChevronDown,
  ArrowRight, Bell, Activity, Save
} from 'lucide-react';
import { Field } from '../types';

interface AutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  isRunning: boolean; // Visual state for when condition is met
  trigger: {
    fieldId: string;
    sensor: 'humidity' | 'temp' | 'rain_prob';
    condition: '<' | '>' | '=';
    value: number;
  };
  action: {
    type: 'irrigation_on' | 'irrigation_off' | 'notify';
    duration?: number; // Minutes
  };
}

interface AutomationHubProps {
  fields: Field[];
  onToggleIrrigation: (fieldId: string, status: boolean) => void;
  onClose: () => void;
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: '1',
    name: 'Proteção contra Seca',
    isActive: true,
    isRunning: false,
    trigger: { fieldId: 'all', sensor: 'humidity', condition: '<', value: 30 },
    action: { type: 'irrigation_on', duration: 20 }
  },
  {
    id: '2',
    name: 'Paragem por Chuva',
    isActive: true,
    isRunning: false,
    trigger: { fieldId: 'all', sensor: 'rain_prob', condition: '>', value: 60 },
    action: { type: 'irrigation_off' }
  }
];

const AutomationHub: React.FC<AutomationHubProps> = ({ fields, onToggleIrrigation, onClose }) => {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Wizard State
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    trigger: { fieldId: fields[0]?.id || '', sensor: 'humidity', condition: '<', value: 40 },
    action: { type: 'notify', duration: 15 }
  });
  const [ruleName, setRuleName] = useState('');

  // --- SIMULATION ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      setRules(currentRules => {
        return currentRules.map(rule => {
          if (!rule.isActive) return { ...rule, isRunning: false };

          // Determine target fields (Single or All)
          const targetFields = rule.trigger.fieldId === 'all' 
            ? fields 
            : fields.filter(f => f.id === rule.trigger.fieldId);

          let conditionMet = false;

          targetFields.forEach(field => {
            // Get Sensor Value
            let sensorValue = 0;
            if (rule.trigger.sensor === 'humidity') sensorValue = field.humidity;
            if (rule.trigger.sensor === 'temp') sensorValue = field.temp;
            // Mock rain prob if not in field data, or map from weather API in real app
            if (rule.trigger.sensor === 'rain_prob') sensorValue = 20; // Mock

            // Evaluate Condition
            const isMet = 
              (rule.trigger.condition === '<' && sensorValue < rule.trigger.value) ||
              (rule.trigger.condition === '>' && sensorValue > rule.trigger.value) ||
              (rule.trigger.condition === '=' && sensorValue === rule.trigger.value);

            if (isMet) {
              conditionMet = true;
              
              // EXECUTE ACTION (Only if state changed to running to avoid spam)
              if (!rule.isRunning) {
                if (rule.action.type === 'irrigation_on' && !field.irrigationStatus) {
                  console.log(`[Auto] Starting irrigation on ${field.name}`);
                  onToggleIrrigation(field.id, true);
                } else if (rule.action.type === 'irrigation_off' && field.irrigationStatus) {
                  console.log(`[Auto] Stopping irrigation on ${field.name}`);
                  onToggleIrrigation(field.id, false);
                }
              }
            }
          });

          return { ...rule, isRunning: conditionMet };
        });
      });
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [fields, onToggleIrrigation]);

  // --- HANDLERS ---
  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive, isRunning: false } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const saveNewRule = () => {
    if (!ruleName || !newRule.trigger || !newRule.action) return;

    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: ruleName,
      isActive: true,
      isRunning: false,
      trigger: newRule.trigger as AutomationRule['trigger'],
      action: newRule.action as AutomationRule['action']
    };

    setRules([...rules, rule]);
    setIsWizardOpen(false);
    setRuleName('');
  };

  // --- RENDER HELPERS ---
  const getSensorIcon = (sensor: string) => {
    switch(sensor) {
      case 'humidity': return <Droplets size={18} className="text-blue-500" />;
      case 'temp': return <Thermometer size={18} className="text-orange-500" />;
      case 'rain_prob': return <CloudRain size={18} className="text-indigo-500" />;
      default: return <Activity size={18} />;
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'irrigation_on': return <Zap size={18} className="text-yellow-500" />;
      case 'irrigation_off': return <Power size={18} className="text-gray-500" />;
      case 'notify': return <Bell size={18} className="text-purple-500" />;
      default: return <CheckCircle2 size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 md:p-4">
      <div className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full md:max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border-t border-white/20 transition-all">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-6 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl animate-pulse-slow">
              <Workflow size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none">Piloto Automático</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">Gestão Inteligente de Rega</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Rules List */}
          {!isWizardOpen && (
            <div className="space-y-4">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className={`relative p-5 rounded-[2rem] border transition-all ${
                    rule.isActive 
                      ? 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 shadow-lg' 
                      : 'bg-gray-50 dark:bg-neutral-900/50 border-transparent opacity-70 grayscale'
                  } ${rule.isRunning ? 'ring-2 ring-agro-green ring-offset-2 dark:ring-offset-black' : ''}`}
                >
                  {/* Status Banner */}
                  {rule.isRunning && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-agro-green rounded-t-[2rem] animate-pulse"></div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{rule.name}</h4>
                      {rule.isRunning && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                          <Play size={8} fill="currentColor" /> A Executar
                        </span>
                      )}
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => toggleRule(rule.id)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${
                        rule.isActive ? 'bg-agro-green' : 'bg-gray-300 dark:bg-neutral-700'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        rule.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>

                  {/* Logic Visualizer */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 p-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      {getSensorIcon(rule.trigger.sensor)}
                      <span>{rule.trigger.sensor === 'humidity' ? 'Humidade' : rule.trigger.sensor === 'temp' ? 'Temp' : 'Chuva'}</span>
                    </div>
                    
                    <span className="bg-gray-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-gray-500 font-black">
                      {rule.trigger.condition} {rule.trigger.value}{rule.trigger.sensor === 'temp' ? '°C' : '%'}
                    </span>

                    <ArrowRight size={14} className="text-gray-400 shrink-0" />

                    <div className="flex items-center gap-1 whitespace-nowrap text-agro-green dark:text-green-400">
                      {getActionIcon(rule.action.type)}
                      <span>
                        {rule.action.type === 'irrigation_on' ? 'LIGAR' : rule.action.type === 'irrigation_off' ? 'DESLIGAR' : 'Notificar'}
                      </span>
                    </div>

                    {rule.action.duration && (
                      <span className="bg-agro-green/10 text-agro-green px-1.5 py-0.5 rounded">
                        {rule.action.duration}min
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteRule(rule.id)}
                    className="absolute bottom-5 right-5 p-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button 
                onClick={() => setIsWizardOpen(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-[2rem] text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <Plus size={20} /> Nova Regra
              </button>
            </div>
          )}

          {/* Wizard Interface */}
          {isWizardOpen && (
            <div className="animate-slide-up pb-20">
              <div className="mb-6">
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nome da Regra</label>
                <input 
                  autoFocus
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Ex: Rega de Emergência Milho"
                  className="w-full p-4 bg-white dark:bg-neutral-800 rounded-2xl text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                />
              </div>

              <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                
                {/* Natural Language Sentence Builder */}
                <div className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span className="text-gray-400 uppercase text-xs block mb-2 font-black tracking-widest">Gatilho (Trigger)</span>
                  SE 
                  <select 
                    className="mx-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg outline-none cursor-pointer border-b-2 border-blue-200 dark:border-blue-800"
                    onChange={(e) => setNewRule({...newRule, trigger: {...newRule.trigger!, fieldId: e.target.value}})}
                    value={newRule.trigger?.fieldId}
                  >
                    <option value="all">Qualquer Campo</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  tiver 
                  <select 
                    className="mx-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg outline-none cursor-pointer border-b-2 border-orange-200 dark:border-orange-800"
                    onChange={(e) => setNewRule({...newRule, trigger: {...newRule.trigger!, sensor: e.target.value as any}})}
                    value={newRule.trigger?.sensor}
                  >
                    <option value="humidity">Humidade Solo</option>
                    <option value="temp">Temperatura</option>
                    <option value="rain_prob">Prob. Chuva</option>
                  </select>
                  
                  <select 
                    className="mx-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg outline-none cursor-pointer"
                    onChange={(e) => setNewRule({...newRule, trigger: {...newRule.trigger!, condition: e.target.value as any}})}
                    value={newRule.trigger?.condition}
                  >
                    <option value="<">menor que</option>
                    <option value=">">maior que</option>
                    <option value="=">igual a</option>
                  </select>

                  <input 
                    type="number"
                    className="w-16 text-center bg-gray-100 dark:bg-neutral-700 rounded-lg py-1 outline-none focus:ring-2 focus:ring-agro-green"
                    value={newRule.trigger?.value}
                    onChange={(e) => setNewRule({...newRule, trigger: {...newRule.trigger!, value: parseInt(e.target.value)}})}
                  />
                  {newRule.trigger?.sensor === 'temp' ? '°C' : '%'},
                </div>

                <div className="h-px bg-gray-100 dark:bg-neutral-700 w-full my-4"></div>

                <div className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span className="text-gray-400 uppercase text-xs block mb-2 font-black tracking-widest">Ação (Action)</span>
                  ENTÃO
                  <select 
                    className="mx-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg outline-none cursor-pointer border-b-2 border-green-200 dark:border-green-800"
                    onChange={(e) => setNewRule({...newRule, action: {...newRule.action!, type: e.target.value as any}})}
                    value={newRule.action?.type}
                  >
                    <option value="irrigation_on">LIGAR Rega</option>
                    <option value="irrigation_off">DESLIGAR Rega</option>
                    <option value="notify">Apenas Notificar</option>
                  </select>
                  
                  {newRule.action?.type === 'irrigation_on' && (
                    <>
                      durante 
                      <input 
                        type="number"
                        className="w-16 mx-1 text-center bg-gray-100 dark:bg-neutral-700 rounded-lg py-1 outline-none focus:ring-2 focus:ring-agro-green"
                        value={newRule.action?.duration}
                        onChange={(e) => setNewRule({...newRule, action: {...newRule.action!, duration: parseInt(e.target.value)}})}
                        placeholder="20"
                      />
                      minutos.
                    </>
                  )}
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setIsWizardOpen(false)}
                  className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-2xl font-bold text-gray-500"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveNewRule}
                  disabled={!ruleName}
                  className={`flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform flex items-center justify-center gap-2 ${!ruleName ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save size={20} /> Guardar Regra
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AutomationHub;