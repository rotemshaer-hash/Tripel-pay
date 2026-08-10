import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { ChildCarousel } from "../../components/ChildSwitcher";
import { SectionTitle, EmptyState } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { MissionTrail } from "../../components/MissionTrail";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import type { TaskItem } from "../../data/types";

function Group({
  title,
  tasks,
  childId,
  dispatch,
  onApprove,
}: {
  title: string;
  tasks: TaskItem[];
  childId: string;
  dispatch: ReturnType<typeof useStore>["dispatch"];
  onApprove: (title: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {tasks.length === 0 ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState text="אין כאן מטלות כרגע" actionLabel="למאגר המטלות" onAction={() => navigate("/parent/tasks-bank")} />
        </div>
      ) : (
        <MissionTrail
          items={tasks.map((t) => ({
            task: t,
            actionLabel: t.status === "pending_approval" ? "אישור" : undefined,
            onAction:
              t.status === "pending_approval"
                ? () => {
                    dispatch({ type: "APPROVE_TASK", childId, taskId: t.id });
                    onApprove(t.title);
                  }
                : undefined,
          }))}
        />
      )}
    </>
  );
}

export function ChildTasks() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const { toastMessage, showToast } = useToast();

  const pending = child.tasks.filter((t) => t.status === "pending_approval");
  const inProgress = child.tasks.filter((t) => t.status === "in_progress" || t.status === "available");
  const done = child.tasks.filter((t) => t.status === "completed");

  function approve(title: string) {
    showToast(`המטלה "${title}" אושרה ל${child.name}`);
  }

  return (
    <div className="screen">
      <Header title={`המטלות של ${child.name}`} back tint="playful" />
      <ChildCarousel children={childrenList(state.family)} activeId={child.id} onSelect={(id) => dispatch({ type: "SET_ACTIVE_CHILD", childId: id })} />
      <Group title="מטלות ממתינות לאישור" tasks={pending} childId={child.id} dispatch={dispatch} onApprove={approve} />
      <Group title="מטלות בביצוע" tasks={inProgress} childId={child.id} dispatch={dispatch} onApprove={approve} />
      <Group title="מטלות שבוצעו" tasks={done} childId={child.id} dispatch={dispatch} onApprove={approve} />
      <div style={{ height: 20 }} />
      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
