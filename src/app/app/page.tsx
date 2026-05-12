import { redirect } from "next/navigation";

export default function LegacyAppIndex() {
  redirect("/browse");
}
