import {redirect} from "next/navigation";

export default function defaultPage() {
    redirect("/login");
}