import RemoteQueue from "@/components/RemoteQueue";

export const metadata = {
  title: "Kö – Trainstation Makerspace",
  description: "Följ kön i realtid",
};

export default function RemotePage() {
  return <RemoteQueue />;
}
