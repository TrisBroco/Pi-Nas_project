import {CiCircleInfo} from "react-icons/ci";

export default function MenuButtons({
                                        name, icon: Icon, color = "text-white", size = "text-2xl",
                                        isActive = true, onClick
                                    }) {
    return (
        <div>
            <button
                onClick={onClick ?? (() => {})}
                className={`w-[200px]  ${isActive ? 'text-white menu-btn' : 'text-gray-600'}
                 flex gap-3 p-2`}
            >
                {Icon ? (
                    <Icon className={`${color} ${size}`}/>
                ) : (
                    <CiCircleInfo/>
                )}
                {name}
            </button>
        </div>
    );
}