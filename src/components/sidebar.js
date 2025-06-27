import {
  FiHome,
  FiBell,
  FiMail,
  FiSettings,
  FiPieChart,
  FiLogOut,
} from "react-icons/fi";

const icons = [FiPieChart, FiHome, FiMail, FiBell, FiSettings, FiLogOut];

export default function Sidebar() {
  return (
    <div className="w-20 bg-[#252836] flex flex-col items-center justify-evenly">
      <div className="bg-[#EA7C69] p-2 rounded-xl">
        <FiPieChart size={24} />
      </div>

      {icons.slice(1).map((Icon, idx) => (
        <div
          className="hover:bg-orange-300/30 w-full flex justify-center py-3 hover:text-white"
          key={idx}
        >
          <Icon
            className="text-[#EA7C69] hover:scale-145 transition-transform duration-300"
            size={24}
          />
        </div>
      ))}
    </div>
  );
}
