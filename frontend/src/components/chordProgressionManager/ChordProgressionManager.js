import React, { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import { deleteCookie, getObjectFromCookie, saveObjectToCookie } from "./utils";
import { useBreakpoint } from "../common/utils";
import cloneDeep from "lodash.clonedeep";
import ChordPanel from "./ChordPanel";
import FooterButtons from "./FooterButtons";
import ChordRow from "./ChordRow";
import Message from "../common/Message";

const Under2xlStyle = {
  maxWidth: "initial",
  transformOrigin: "top left",
  width: "calc(100% / 0.85)",
};

/**
 * コンポーネント本体
 * @returns
 */
const ChordProgressionManager = () => {
  const [chords, _setChords] = useState({});
  const [currentRow, setCurrentRow] = useState("");
  const [rowName, _setRowName] = useState({});
  const [tempo, _setTempo] = useState(90);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cookieEnabled, setCookieEnabled] = useState(false);
  const { is2xl } = useBreakpoint("2xl");

  // 各種保存処理
  const setChords = (v) => {
    _setChords(v);
    if (cookieEnabled) saveToCookies({ chords: v, rowName, tempo });
  };

  const setRowName = (v) => {
    _setRowName(v);
    if (cookieEnabled) saveToCookies({ chords, rowName: v, tempo });
  };

  const setTempo = (v) => {
    _setTempo(v);
    if (cookieEnabled) saveToCookies({ chords, rowName, tempo: v });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const cookieObj = getObjectFromCookie(
      "angocat.com.chord-progression-manager"
    );
    if (cookieObj) {
      setChords(cookieObj.chords);
      setRowName(cookieObj.rowName);
      setTempo(cookieObj.tempo);
      setCookieEnabled(true);

      if (Object.entries(cookieObj.chords).length > 0) {
        setCurrentRow(Object.keys(cookieObj.chords)[0]);
      }
      return;
    }

    const id = uuidv4();
    setChords({ [id]: [] });
    setCurrentRow(id);
  }, []);

  // Cookieに保存
  function saveToCookies(obj) {
    saveObjectToCookie(
      "angocat.com.chord-progression-manager",
      obj || {
        chords,
        rowName,
        tempo,
      }
    );
    setCookieEnabled(true);

    if (!obj) {
      setInfo("Cookie saving mode is now ON.");
    }
  }

  // Cookieから削除
  function deleteCookies() {
    deleteCookie("angocat.com.chord-progression-manager");
    setCookieEnabled(false);
  }

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

  // 行削除
  const deleteRow = (id) => {
    const newChords = cloneDeep(chords);
    delete newChords[id];
    setChords(newChords);

    // rowName
    const newRowName = { ...rowName };
    delete newRowName[id];
    setRowName(newRowName);
    if (cookieEnabled)
      saveToCookies({ chords: newChords, rowName: newRowName });
  };

  // 行複製
  const duplicateRow = (id) => {
    // chords
    const newChords = cloneDeep(chords);
    const entries = Object.entries(newChords);
    const duplicated = entries.find(([e, v]) => e == id);
    const duplicatedIndex = entries.findIndex(([e, v]) => e == id);
    const newRowId = uuidv4();
    const duplicatedValue = duplicated[1].map((d) => {
      const newD = cloneDeep(d);
      newD.id = uuidv4();
      newD.rowId = newRowId;
      return newD;
    });
    entries.splice(duplicatedIndex + 1, 0, [newRowId, duplicatedValue]);
    const _newChords = Object.fromEntries(entries);
    setChords(_newChords);

    // rowName
    const newRowName = { ...rowName };
    newRowName[newRowId] = newRowName[id];
    setRowName(newRowName);
    if (cookieEnabled)
      saveToCookies({ chords: _newChords, rowName: newRowName });
  };

  return (
    <div
      className={`
        container pl-16 grid grid-cols-4 h-full flex flex-row
        justify-start items-start transform origin-top`}
      style={{
        maxWidth: "2000px",
        transform: "scale(.85)",
        ...(!is2xl ? Under2xlStyle : {}),
      }}
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
              <Message type="error" msg={error} />
            </div>
          )}

          {/* お知らせ */}
          {info && (
            <div
              className="mt-8 w-full cursor-pointer"
              onClick={() => setInfo("")}
            >
              <Message type="info" msg={info} />
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
                  deleteRow,
                  duplicateRow,
                }}
              />
            ))}
          </DndContext>
        </div>
        <FooterButtons
          {...{ tempo, setTempo, cookieEnabled, saveToCookies, deleteCookies }}
        />
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
