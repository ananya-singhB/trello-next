import { Suspense, lazy } from "react";
import Loader from "@/components/Loader"
import { Board } from "@/types";

const BoardContent = lazy(() => import("./BoardContent"));


export default function Boards({ selectedBoardId, boards }: { selectedBoardId: number | null, boards: Board[] }) {
  if (!selectedBoardId) {
    return (
      <div className="text-center text-gray-400 text-xl mt-20">
        No board selected
        <br />
        <span className="text-base">Create or select a board</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <BoardContent
        key={`board-${selectedBoardId}`}
        selectedBoardId={selectedBoardId}
      />
    </Suspense>
  );
}
