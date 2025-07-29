import "./globals.css";

export const metadata = {
  title: "Cointab Developer Assignment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex">
        <main className="flex-1 bg-gray-100">
          {children}
        </main>
      </body>
    </html>
  );
}
