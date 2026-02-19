import { AgriculturalDisease } from '../types';

export const MEDITERRANEAN_DISEASES: AgriculturalDisease[] = [
    {
        id: 'VIN-MIL',
        name: 'Míldio da Videira',
        scientificName: 'Plasmopara viticola',
        culture: 'Vinha',
        severity: 'High',
        symptoms: ['Manchas de óleo na face superior', 'Erupção esbranquiçada na face inferior', 'Exsudação nos polvilhos'],
        treatment: {
            immediate: 'Tratamento com fungicida de contacto (Cobre ou semelhante)',
            preventive: 'Poda arejada e controlo do coberto vegetal',
            products: ['Calda Bordalesa', 'Metalaxil', 'Folpet']
        }
    },
    {
        id: 'VIN-OID',
        name: 'Oídio da Videira',
        scientificName: 'Erysiphe necator',
        culture: 'Vinha',
        severity: 'High',
        symptoms: ['Pó cinzento-esbranquiçado nas folhas e bagos', 'Bagas rachadas', 'Folhas encarquilhadas'],
        treatment: {
            immediate: 'Aplicação de enxofre em pó ou molhável',
            preventive: 'Remoção de rebentos ladrões e desfolha precoce',
            products: ['Enxofre', 'Azoxistrobina', 'Tebuconazol']
        }
    },
    {
        id: 'OLI-GAF',
        name: 'Gafa da Oliveira',
        scientificName: 'Colletotrichum acutatum',
        culture: 'Olival',
        severity: 'Critical',
        symptoms: ['Manchas circulares e escuras no fruto', 'Exsudação gelatinosa laranja', 'Secagem prematura'],
        treatment: {
            immediate: 'Eliminação de frutos infetados e aplicação cúprica',
            preventive: 'Colheita precoce e poda de limpeza',
            products: ['Óxido de Cobre', 'Hidróxido de Cobre']
        }
    },
    {
        id: 'OLI-REP',
        name: 'Repilo da Oliveira',
        scientificName: 'Spilocaea oleagina',
        culture: 'Olival',
        severity: 'Medium',
        symptoms: ['Manchas circulares ("olho de pavão") nas folhas', 'Queda prematura de folhas', 'Debilidade da árvore'],
        treatment: {
            immediate: 'Tratamento com fungicidas cúpricos no outono e primavera',
            preventive: 'Espaçamento adequado entre árvores',
            products: ['Cobre', 'Dodina']
        }
    }
];
