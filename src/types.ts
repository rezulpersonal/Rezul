export interface Photo {
  id: string;
  title: string;
  category: string;
  url: string;
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  date: string;
  featured: boolean;
}

export interface InquiryFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

export interface AppSettings {
  contactEmail: string;
}

