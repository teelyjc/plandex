"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import type { PlanningSnapshot, Task, Workspace } from "../types/planning";

const statusLabels: Record<Task["status"], string> = {
  backlog: "รอดำเนินการ",
  ready: "พร้อมดำเนินการ",
  active: "กำลังดำเนินการ",
  review: "รอตรวจสอบ",
  done: "แล้วเสร็จ",
};

const priorityLabels: Record<Task["priority"], string> = {
  Low: "ต่ำ",
  Medium: "ปานกลาง",
  High: "สูง",
};

type ThaiOfficialDocumentProps = {
  snapshot: PlanningSnapshot;
  workspace: Workspace;
};

export function ThaiOfficialDocument({ snapshot, workspace }: ThaiOfficialDocumentProps) {
  const documentRef = useRef<HTMLElement>(null);
  const tasks = snapshot.tasks;
  const taskTodos = tasks.flatMap((task) =>
    task.checklist.map((todo) => ({
      ...todo,
      taskTitle: task.title,
    })),
  );
  const todos = [
    ...snapshot.todos.map((todo) => ({
      ...todo,
      taskTitle: "รายการทั่วไปของพื้นที่ทำงาน",
    })),
    ...taskTodos,
  ];
  const documentDate = useMemo(() => formatThaiOfficialDate(new Date()), []);

  async function downloadDocument() {
    if (!documentRef.current) {
      return;
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(documentRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const imageData = canvas.toDataURL("image/png");
    let remainingHeight = imageHeight;
    let y = 0;

    pdf.addImage(imageData, "PNG", 0, y, imageWidth, imageHeight);
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      y -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", 0, y, imageWidth, imageHeight);
      remainingHeight -= pageHeight;
    }

    pdf.save(`plandex-${workspace.id}-document.pdf`);
  }

  return (
    <main className="bg-[#f7f6f2] px-4 py-5 text-[#1f2623] sm:px-6 lg:px-8">
      <section className="mx-auto mb-4 flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspaces/${workspace.id}`}
            className="inline-flex h-10 items-center rounded-md border border-[#d6d2c8] bg-white px-3 text-sm font-medium text-[#3d4742] transition hover:border-[#949b93]"
          >
            Back to workspace
          </Link>
        </div>
        <button
          type="button"
          onClick={downloadDocument}
          className="h-10 rounded-md bg-[#1f2623] px-4 text-sm font-semibold text-white"
        >
          Download PDF
        </button>
      </section>

      <article
        ref={documentRef}
        className="document-page mx-auto min-h-[1123px] w-full max-w-5xl bg-white px-8 py-10 text-[#111] shadow-sm sm:px-14 lg:px-20"
      >
        <header className="document-workspace border-b border-[#222] pb-4 text-center">
          <h1 className="text-3xl font-semibold">{workspace.name}</h1>
          <p className="mt-2 text-lg">{workspace.description || "รายละเอียดพื้นที่ทำงาน"}</p>
        </header>

        <section className="mt-8 space-y-2 text-lg leading-8">
          <div className="grid grid-cols-[82px_1fr] gap-3">
            <span className="font-semibold">วันที่</span>
            <span>{documentDate}</span>
          </div>
          <div className="grid grid-cols-[82px_1fr] gap-3">
            <span className="font-semibold">เรื่อง</span>
            <span>รายงานสรุปแผนงานและรายการดำเนินการของพื้นที่ทำงาน</span>
          </div>
        </section>

        <section className="mt-8 text-lg leading-8">
          <p className="indent-12">
            ตามที่ได้มีการกำหนดแผนงานและรายการดำเนินการภายในพื้นที่ทำงาน
            {` "${workspace.name}" `}
            เพื่อใช้ในการติดตามความก้าวหน้า การจัดลำดับความสำคัญ และการบริหารงานให้เป็นไปด้วยความเรียบร้อย
            จึงขอสรุปรายการงานและรายการสิ่งที่ต้องดำเนินการ ดังต่อไปนี้
          </p>

          <section className="mt-6">
            <h2 className="text-xl font-semibold">๑. รายการงาน</h2>
            {tasks.length > 0 ? (
              <ol className="mt-2 space-y-2 pl-8">
                {tasks.map((task, index) => (
                  <li key={task.id}>
                    <span>{toThaiDigits(index + 1)}. </span>
                    <span className="font-semibold">{task.title}</span>
                    <span>
                      {` สถานะ${statusLabels[task.status]} ระดับความสำคัญ${priorityLabels[task.priority]} กำหนดดำเนินการระหว่างวันที่ ${formatThaiShortDate(task.startDate)} ถึงวันที่ ${formatThaiShortDate(task.dueDate)}`}
                    </span>
                    {task.description ? <span>{` โดยมีรายละเอียดว่า ${task.description}`}</span> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2">ยังไม่มีรายการงานที่บันทึกไว้ในพื้นที่ทำงานนี้</p>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-semibold">๒. รายการสิ่งที่ต้องดำเนินการ</h2>
            {todos.length > 0 ? (
              <ol className="mt-2 space-y-2 pl-8">
                {todos.map((todo, index) => (
                  <li key={todo.id}>
                    <span>{toThaiDigits(index + 1)}. </span>
                    <span className="font-semibold">{todo.title}</span>
                    <span>{` อ้างอิงจาก${todo.taskTitle} สถานะ${todo.done ? "แล้วเสร็จ" : "ยังไม่แล้วเสร็จ"}`}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2">ยังไม่มีรายการสิ่งที่ต้องดำเนินการที่บันทึกไว้ในพื้นที่ทำงานนี้</p>
            )}
          </section>

          <p className="mt-6 indent-12">
            จึงเรียนมาเพื่อโปรดทราบ และใช้เป็นข้อมูลประกอบการติดตามการดำเนินงานในลำดับต่อไป
          </p>
        </section>
      </article>
    </main>
  );
}

function formatThaiOfficialDate(value: Date) {
  return toThaiDigits(new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value));
}

function formatThaiShortDate(value: string) {
  return toThaiDigits(new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`)));
}

function toThaiDigits(value: string | number) {
  const digits: Record<string, string> = {
    "0": "๐",
    "1": "๑",
    "2": "๒",
    "3": "๓",
    "4": "๔",
    "5": "๕",
    "6": "๖",
    "7": "๗",
    "8": "๘",
    "9": "๙",
  };

  return String(value).replace(/[0-9]/g, (digit) => digits[digit]);
}
