export type CsvField =
  | 'company'
  | 'contact_name'
  | 'email'
  | 'whatsapp'
  | 'role'
  | 'city'
  | 'region'
  | 'country'
  | 'website'
  | 'technical_notes'
  | 'skip';

const FIELD_ALIASES: Record<Exclude<CsvField, 'skip'>, string[]> = {
  company:         ['empresa', 'company', 'nome da empresa', 'organizacao', 'razao social', 'company name'],
  contact_name:    ['nome', 'contato', 'nome do contato', 'name', 'contact', 'contact name', 'full name', 'nome completo'],
  email:           ['email', 'e-mail', 'mail', 'correio', 'correo'],
  whatsapp:        ['whatsapp', 'telefone', 'celular', 'phone', 'mobile', 'tel', 'fone', 'contato telefonico'],
  role:            ['cargo', 'role', 'position', 'titulo', 'job title', 'ocupacao'],
  city:            ['cidade', 'city', 'ciudad', 'municipio'],
  region:          ['estado', 'regiao', 'uf', 'state', 'region', 'province', 'provincia'],
  country:         ['pais', 'country', 'pais de origem', 'país'],
  website:         ['site', 'website', 'url', 'pagina', 'web'],
  technical_notes: ['observacao', 'observacoes', 'notas', 'notes', 'comentarios', 'remarks'],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectMapping(headers: string[]): Record<string, CsvField> {
  const result: Record<string, CsvField> = {};
  for (const header of headers) {
    const norm = normalize(header);
    let found: CsvField = 'skip';
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [Exclude<CsvField, 'skip'>, string[]][]) {
      if (aliases.some(a => normalize(a) === norm)) {
        found = field;
        break;
      }
    }
    result[header] = found;
  }
  return result;
}

const COUNTRY_ALIASES: Record<string, string> = {
  brasil: 'Brasil', br: 'Brasil', brazil: 'Brasil',
  mexico: 'México', mx: 'México', mexique: 'México',
  argentina: 'Argentina', ar: 'Argentina',
  colombia: 'Colômbia', co: 'Colômbia',
  paraguai: 'Paraguai', paraguay: 'Paraguai', py: 'Paraguai',
  chile: 'Chile', cl: 'Chile',
  peru: 'Peru', pe: 'Peru',
  'estados unidos': 'Estados Unidos',
  usa: 'Estados Unidos',
  us: 'Estados Unidos',
  'united states': 'Estados Unidos',
  eua: 'Estados Unidos',
};

export function normalizeCountry(value: string): string {
  const norm = normalize(value);
  return COUNTRY_ALIASES[norm] ?? 'Outro';
}
