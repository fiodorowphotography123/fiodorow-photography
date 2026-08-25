/**
 * Ocena z wizytówki Google — jedno źródło prawdy dla całego serwisu.
 *
 * Liczby są wpisane ręcznie, bo build na Vercelu nie ma dostępu do OAuth
 * właściciela wizytówki. Aktualizować przy okazji przeglądu wizytówki.
 *
 * Ostatnia weryfikacja: 2026-08-25 (Business Profile API, 54 opinie, średnia 5,0).
 */
export const googleReviews = {
  count: 54,
  rating: 5.0,
  /** Wizytówka w Mapach — otwiera profil z opiniami. */
  url: "https://www.google.com/maps?cid=1555365222895602722",
  /** Data ostatniej weryfikacji liczb powyżej. */
  verifiedOn: "2026-08-25",
} as const;
