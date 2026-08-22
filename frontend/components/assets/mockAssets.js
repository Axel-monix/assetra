// components/assets/mockAssets.js
// TODO: ganti dengan fetch ke GET /api/assets. Struktur field di sini
// (sn, category, status, location, specs, treatmentHistory) dipakai
// langsung oleh AssetCard & AssetDetailPanel, jadi samain shape-nya
// waktu backend-nya jadi.

const mockAssets = [
  {
    id: "SN-KL-2024-001",
    name: "MacBook Pro M3 Max",
    category: "Laptop",
    status: "Tersedia",
    location: "Lemari Laptop",
    specs: {
      Processor: "M3 Max (14-core CPU)",
      Memory: "64GB Unified RAM",
      Storage: "1TB SSD",
    },
    treatmentHistory: [
      {
        date: "12 Jan 2024",
        title: "Routine Software Update",
        meta: "Admin: TechSupport-01",
      },
      {
        date: "05 Des 2023",
        title: "Penerimaan Unit Baru",
        meta: "Vendor: Apple Inc",
      },
    ],
  },
  {
    id: "PR-EPN-2018-3110",
    name: "EPSON L3110",
    category: "Printer",
    status: "Tersedia",
    location: "Meja Admin",
    specs: { Tipe: "Ink Tank", Konektivitas: "USB" },
    treatmentHistory: [
      {
        date: "20 Jun 2026",
        title: "Cek Tinta Berkala",
        meta: "Admin: Eji Prasono",
      },
    ],
  },
  {
    id: "SN-KL-2024-089",
    name: "Sharp Microwave Oven R-21D0(S)-IN",
    category: "Microwave",
    status: "Maintenance",
    location: "Dapur",
    specs: { Daya: "450W", Kapasitas: "18L" },
    treatmentHistory: [
      {
        date: "01 Jul 2026",
        title: "Perbaikan Panel Kontrol",
        meta: "Vendor: Sharp Service Center",
      },
    ],
  },
  {
    id: "SN-KL-2021-005",
    name: "Monitor HP 19 Inch",
    category: "Monitor",
    status: "Rusak",
    location: "Workshop",
    specs: { Resolusi: "1366x768", Panel: "TN" },
    treatmentHistory: [
      {
        date: "15 Jul 2026",
        title: "Layar Bergaris, Menunggu Sparepart",
        meta: "Admin: Fikar Sanjaya",
      },
    ],
  },
];

export default mockAssets;
