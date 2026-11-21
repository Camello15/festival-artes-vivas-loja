import type { ArtistKind, AvailabilityStatus, Discipline, PerformanceStatus } from '../../lib/labels';

export interface VenueSummary {
  id: number;
  name: string;
}

export interface VenueListItem extends VenueSummary {
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
}

export interface EventSummary {
  id: number;
  title: string;
  discipline: Discipline;
  durationMinutes: number;
  imageUrl: string | null;
}

export interface PerformanceItem {
  id: number;
  startsAt: string;
  status: PerformanceStatus;
  capacity: number;
  availableSeats: number;
  availability: AvailabilityStatus;
  event: EventSummary;
  venue: VenueSummary;
}

export interface PerformanceFiltersResponse {
  dates: string[];
  disciplines: Discipline[];
  venues: VenueSummary[];
}

export interface PerformanceQuery {
  date?: string;
  discipline?: Discipline | '';
  venueId?: number | '';
  includePast?: boolean;
}

export interface ArtistListItem {
  id: number;
  name: string;
  kind: ArtistKind;
  country: string;
  imageUrl: string | null;
}

export interface ArtistDetail extends ArtistListItem {
  bio: string;
  website: string | null;
  events: Array<{
    id: number;
    title: string;
    discipline: Discipline;
  }>;
}

export interface EventPerformanceItem {
  id: number;
  startsAt: string;
  status: PerformanceStatus;
  capacity: number;
  availableSeats: number;
  availability: AvailabilityStatus;
  venue: VenueSummary;
}

export interface EventDetail {
  id: number;
  title: string;
  synopsis: string;
  discipline: Discipline;
  durationMinutes: number;
  ageRating: string;
  imageUrl: string | null;
  artists: ArtistListItem[];
  performances: EventPerformanceItem[];
}

export interface VenueDetail extends VenueListItem {
  description: string;
  upcomingPerformances: PerformanceItem[];
}
