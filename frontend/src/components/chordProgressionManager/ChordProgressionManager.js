import React, { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash.clonedeep";
import ErrorMsg from "../common/ErrorMsg";
import ChordPanel from "./ChordPanel";
import FooterButtons from "./FooterButtons";
import ChordRow from "./ChordRow";

/**
 * コンポーネント本体
 * @returns
 */
const ChordProgressionManager = () => {
  const [chords, setChords] = useState({});
  const [currentRow, setCurrentRow] = useState("");
  const [rowName, setRowName] = useState({});
  const [tempo, setTempo] = useState(90);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const id = uuidv4();
    setChords({ [id]: [] });
    setCurrentRow(id);
  }, []);

  // コード移動
  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.data.current.type == "row") {
      handleDragEndRow(event);
      return;
    }

    if (!over || active.id == over.id) {
      return;
    }

    const newChords = cloneDeep(chords);

    // draggableを取得
    const overRowId = over.id.split("_")[0];
    const overChordId = over.id.split("_")[1];
    const activeRowId = active.id.split("_")[0];
    const activeChordId = active.id.split("_")[1];
    const activeChord = chords[activeRowId].filter(
      (c) => c.id == activeChordId
    )[0];
    activeChord.rowId = overRowId;

    // draggable以外を抽出
    newChords[activeRowId] = newChords[activeRowId].filter(
      (c) => c.id != activeChordId
    );

    // droppableの次に挿入
    const overIndex = newChords[overRowId].findIndex(
      (c) => c.id == overChordId
    );
    newChords[overRowId].splice(overIndex + 1, 0, activeChord);
    setChords(newChords);
  }

  // 行移動
  const handleDragEndRow = (event) => {
    const { active, over } = event;
    if (!over || active.id == over.id) {
      return;
    }

    const newChords = cloneDeep(chords);
    const entries = Object.entries(newChords);
    const activeRow = entries.find(([e, v]) => e == active.id);
    const _entries = entries.filter(([e, v]) => e != active.id);
    const overIndex = _entries.findIndex(([e, v]) => e == over.id);
    _entries.splice(overIndex + 1, 0, activeRow);
    setChords(Object.fromEntries(_entries));
  };

  return (
    <div
      className={`
        container pl-16 grid grid-cols-4 h-full flex flex-row
        justify-start items-start transform origin-top`}
      style={{ maxWidth: "2000px", transform: "scale(.85)" }}
    >
      <div
        className={`
          container justify-start p-0 col-span-3 h-full max-h-full
          rounded-lg overflow-y-scroll`}
      >
        <div
          id="row-wrapper"
          className={`
            container bg-base-300 bg-opacity-50 justify-start
            p-8 rounded-lg overflow-y-scroll`}
          style={{ height: "1024px" }}
        >
          <div
            className="btn btn-primary w-full"
            onClick={() => {
              const newChords = cloneDeep(chords);
              setChords(Object.assign({}, { [uuidv4()]: [] }, newChords));
            }}
          >
            Add Row
          </div>

          {/* エラー */}
          {error && (
            <div
              className="mt-8 w-full cursor-pointer"
              onClick={() => setError("")}
            >
              <ErrorMsg msg={error} />
            </div>
          )}

          <Space h={8} />
          <DndContext
            collisionDetection={(rect, droppables) => {
              const { droppableContainers, active } = rect;
              const collisions = rectIntersection(
                rect,
                droppableContainers
              ).filter((over) =>
                active.data.current.type == "row"
                  ? over.data.droppableContainer.data.current.accepts.includes(
                      "row"
                    )
                  : over.data.droppableContainer.data.current.accepts.includes(
                      "chord"
                    )
              );
              return collisions;
            }}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            {Object.entries(chords).map(([id, chord]) => (
              <ChordRow
                key={id}
                {...{
                  id,
                  currentRow,
                  setCurrentRow,
                  rowName,
                  setRowName,
                  chord,
                  setError,
                  tempo,
                }}
              />
            ))}
          </DndContext>
        </div>
        <FooterButtons {...{ tempo, setTempo }} />
      </div>
      <ChordPanel {...{ chords, setChords, currentRow, setError }} />
    </div>
  );
};

/**
 * UIパーツ
 * @returns
 */
const Space = (props) => (
  <div>
    <div className={"h-14 h-" + props.h || ""}></div>
  </div>
);

export default ChordProgressionManager;
