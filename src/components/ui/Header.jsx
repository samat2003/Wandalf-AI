// src/components/Header.jsx
export default function Header() {
  return (
    <header className="flex items-center gap-3 p-4">
      <img
        src="/Magical%20Wand%20and%20Hat%20Logo.png"
        alt="Wandalf"
        className="h-10 w-auto select-none"
        draggable="false"
      />
      <span className="text-xl font-semibold">Wandalf</span>
    </header>
  );
}
