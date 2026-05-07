export type Estudio = {
  id: number;
  study_instance_uid: string;
  accession_number: string;
  descripcion: string;
  modalidad: string;
  fecha_estudio: string;
  series_cnt: number;
  images_cnt: number;
  confirmado: number;
  estado: string;
  paciente_id: number;
  ci: string;
  paciente: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  sucursal_id: number;
  sucursal: string;
  sucursal_clave: string;
  wsp_estado: string | null;
  informes_confirmados: number;
};

export type EstudiosResponse = {
  total: number;
  limit: number;
  offset: number;
  rows: Estudio[];
  user?: { id: number; usuario: string; nombre: string; perfil: string };
};
