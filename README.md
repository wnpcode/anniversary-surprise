# Tahun Pertama Kita

Microsite anniversary yang dibangun dengan Next.js App Router, TypeScript, GSAP, pnpm, dan MongoDB Atlas. Setiap anniversary disimpan sebagai satu dokumen; edisi dengan nilai `year` tertinggi tampil di halaman utama dan semua edisi tersedia di arsip.

## Menjalankan project

- Gunakan Node.js 20.9 atau lebih baru dan pnpm.
- Jalankan `pnpm install`, lalu atur `ANNIV_MONGODB_URI` dan `MONGODB_DB` di `.env.local` untuk membuka project lokal dengan `pnpm dev`. Tambahkan `MONGODB_SEED_URI` sementara saat menjalankan seed script.
- Jalankan `pnpm build` sebelum deploy ke Vercel. Halaman membaca Atlas saat request; project ini tidak lagi memakai static export.
- `pnpm typecheck` memeriksa tipe TypeScript.
- `pnpm db:seed` membuat validator dan index collection, lalu mengimpor seed awal tanpa menimpa dokumen yang sudah ada. Perintah ini memerlukan `MONGODB_SEED_URI` dari user Atlas terpisah dengan role `readWrite` dan `dbAdmin`, serta `MONGODB_DB`.

Setelah dependency berubah, jalankan `pnpm install` untuk menyinkronkan `pnpm-lock.yaml` sebelum deploy.

Di Vercel, atur `ANNIV_MONGODB_URI` ke akun database read-only dan `MONGODB_DB` ke nama database untuk environment yang digunakan. Simpan URI hanya di environment variables server; `.env.local` sudah diabaikan Git. Batasi network access Atlas ke jalur egress Vercel yang dipilih, dan jangan membuka akses ke semua alamat IP.

Untuk membuka `/arsip/` dan `/arsip/[slug]/`, atur `ARCHIVE_USERNAME`, `ARCHIVE_PASSWORD`, dan `ARCHIVE_SESSION_SECRET` sebagai environment variables server di Vercel. Isi username dan password menggunakan nilai yang kamu pilih; buat session secret acak minimal 32 byte, misalnya dengan `openssl rand -base64 32`. Atur variabel yang sama secara lokal di `.env.local`. Login membuat cookie HttpOnly bertanda tangan yang berlaku tujuh hari; halaman utama tetap terbuka. Foto album di `/images/album/` dapat diakses publik supaya tampil di halaman utama. Jangan masukkan nilai kredensial ke source code atau commit.

## Menambahkan anniversary berikutnya

Tambahkan atau edit dokumen di collection `anniversaries` pada MongoDB Atlas. Isi `slug` dan `year` yang unik, lalu sesuaikan tanggal, pengantar, memori, pertanyaan, surat, dan nama penutup. Halaman utama memilih tahun tertinggi secara otomatis; arsip mengurutkan edisi terbaru lebih dulu. Collection validator menjaga bentuk dokumen dan index unik mencegah slug atau tahun ganda. `data/anniversaries.seed.json` hanya menjadi data awal untuk `pnpm db:seed`; seeding ulang tidak menimpa isi Atlas.

### Mengelola foto album

Metadata 65 foto WebP album pertama disimpan di array `photos` pada dokumen anniversary: `src`, `alt`, dan `caption` opsional. Galeri tampil dalam urutan nomor file, dengan thumbnail yang membuka viewer layar penuh. File di `public` tersedia secara publik dan penambahan file memerlukan deploy ulang.

Setelah deploy, sinkronkan metadata foto folder album ke dokumen edisi pertama di Atlas dengan menjalankan `pnpm exec node scripts/sync-first-album.mjs` menggunakan `MONGODB_SEED_URI` dan `MONGODB_DB` yang sama seperti saat seeding. Perintah ini idempoten, melewatkan foto dengan `src` yang sudah ada, dan mempertahankan foto lain yang tersimpan.

Simpan tulisan yang benar-benar personal untuk diedit sendiri sebelum situs dibagikan. Jangan simpan URI atau kredensial database di repository.

## Remote dari smartphone

Situs di laptop atau TV bisa dikendalikan dari HP: pindah ke kembang api pembuka atau penutup, menggulir ke bagian catatan, membuka surat, serta membuka dan menggeser foto album.

- Di laptop atau TV, masuk lewat `/masuk/`, buka `/layar/`, lalu tekan **Jadikan layar ini**. Setelah aktif, mulai dari pembuka atau catatan dan biarkan tab tetap terbuka. Mode layar tersimpan di browser itu (`localStorage`) sampai kamu mematikannya atau sesi login habis.
- Di HP, masuk dengan akun arsip yang sama lalu buka `/remote/`. Baris status di atas menunjukkan apakah layar terhubung dan sedang di halaman mana.
- Perintah dikirim lewat polling pendek ke `/api/remote/` dan disimpan dalam satu dokumen di collection `remote` (dibuat otomatis saat perintah pertama dikirim). Tidak ada WebSocket, jadi jalan di Vercel tanpa dependency tambahan.
- Pengiriman perintah butuh akses tulis. `ANNIV_MONGODB_URI` di Vercel adalah user read-only, jadi atur `MONGODB_REMOTE_URI` ke URI user Atlas dengan role `readWrite` pada database yang sama. Jika kosong, API memakai `ANNIV_MONGODB_URI`.
- Perintah dari HP tersimpan di Atlas (20 terakhir). Layar yang baru menyala mengabaikan perintah lama dan hanya menjalankan perintah yang dikirim sesudahnya. Perintah yang tiba saat tujuannya belum tampil, misalnya membuka surat tepat setelah pindah halaman, diabaikan; kirim ulang setelah status di HP menunjukkan halaman yang benar.
