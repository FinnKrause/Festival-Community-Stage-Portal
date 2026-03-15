import { getRanking } from "@/lib/ranking";

export async function GET() {
  return Response.json(getRanking());
}
