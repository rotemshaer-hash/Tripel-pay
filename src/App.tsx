import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./data/store";
import { MODE } from "./data/vocabulary";
import { entryPath, homePath, loginPathFor } from "./data/routes";

import { Splash } from "./screens/onboarding/Splash";
import { Welcome } from "./screens/onboarding/Welcome";
import { PersonalDetails } from "./screens/onboarding/PersonalDetails";
import { ChildrenDetails } from "./screens/onboarding/ChildrenDetails";
import { Success } from "./screens/onboarding/Success";
import { Login } from "./screens/Login";
import { ChildRegister } from "./screens/ChildRegister";
import { SecondParentRegister } from "./screens/SecondParentRegister";

import { ParentHome } from "./screens/parent/Home";
import { TasksBank } from "./screens/parent/TasksBank";
import { GiftBank } from "./screens/parent/GiftBank";
import { ChildTasks } from "./screens/parent/ChildTasks";
import { ChildHub } from "./screens/parent/ChildHub";
import { ParentSavings } from "./screens/parent/Savings";
import { ParentTransactions } from "./screens/parent/Transactions";
import { ParentAchievements } from "./screens/parent/Achievements";
import { ParentSettings } from "./screens/parent/Settings";
import { HouseRules } from "./screens/parent/HouseRules";

import { ChildHome } from "./screens/child/Home";
import { ChildCourses } from "./screens/child/Courses";
import { ChildSavings } from "./screens/child/Savings";
import { ChildTransactions } from "./screens/child/Transactions";
import { ChildAchievements } from "./screens/child/Achievements";
import { ChildHouseRules } from "./screens/child/HouseRules";
import { ChildMyVouchers } from "./screens/child/MyVouchers";
import { ChildMyCards } from "./screens/child/MyCards";
import { ChildAllTasks } from "./screens/child/AllTasks";

import { WorkJournal } from "./screens/work/WorkJournal";
import { TaskDetail } from "./screens/work/TaskDetail";
import { NewTask } from "./screens/work/NewTask";
import { WorkTasks } from "./screens/work/WorkTasks";
import { WorkTeam } from "./screens/work/WorkTeam";
import { WorkSettings } from "./screens/work/WorkSettings";
import { WorkDirectory } from "./screens/work/WorkDirectory";
import { WorkReport } from "./screens/work/WorkReport";

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const location = useLocation();
  // A task link sent over WhatsApp is opened by someone who is usually signed out.
  // Dropping them on their home screen after signing in loses the thing they were
  // sent, so the destination travels with them.
  if (!state.onboarded) return <Navigate to={loginPathFor(location.pathname + location.search)} replace />;
  return <>{children}</>;
}

// A worker login has its own account, but it's still one linked identity within the
// company record — the manager-only screens (assign work, approve it, edit the roster)
// must never be reachable by typing the URL.
function RequireParent({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const location = useLocation();
  if (!state.onboarded) return <Navigate to={loginPathFor(location.pathname + location.search)} replace />;
  if (state.role === "child") return <Navigate to={homePath("child")} replace />;
  return <>{children}</>;
}

export default function App() {
  const { state } = useStore();

  // In business mode the family surfaces (wallet, savings, rewards, lessons) aren't
  // part of the product, so the entry point goes straight to the work screens:
  // managers land on the journal, workers on their own task list.
  // Where you land when you open the app is a question about who you ARE, not about
  // which side you last looked at. Keying this on viewMode meant one tap on the
  // worker preview made the app re-open on the worker's task list from then on.
  const home = state.onboarded ? homePath(state.role === "child" ? "child" : "parent") : entryPath();

  return (
    <div className="app-backdrop">
      <div className="phone-shell">
        <Routes>
          <Route path="/" element={<Navigate to={home} replace />} />

          <Route path="/onboarding/splash" element={<Splash />} />
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/details" element={<PersonalDetails />} />
          <Route path="/onboarding/children" element={<ChildrenDetails />} />
          <Route path="/onboarding/success" element={<Success />} />
          <Route path="/login" element={<Login />} />
          {/* /join is the short, shareable form; the original path stays valid so
              links already sent to people keep working. */}
          <Route path="/join" element={<ChildRegister />} />
          <Route path="/child-register" element={<ChildRegister />} />
          <Route path="/parent-register" element={<SecondParentRegister />} />

          {/* The family surfaces — wallet, savings, gift bank, house rules, money
              transfers, lessons, achievements — are a different product. In business
              mode they aren't registered at all, so they can't be reached by typing a
              URL either; anything unknown falls through to the redirect below. */}
          {MODE === "family" && (
            <>
              <Route path="/parent" element={<RequireParent><ParentHome /></RequireParent>} />
              <Route path="/parent/tasks-bank" element={<RequireParent><TasksBank /></RequireParent>} />
              <Route path="/parent/gift-bank" element={<RequireParent><GiftBank /></RequireParent>} />
              <Route path="/parent/child-tasks" element={<RequireParent><ChildTasks /></RequireParent>} />
              <Route path="/parent/child-hub" element={<RequireParent><ChildHub /></RequireParent>} />
              <Route path="/parent/savings" element={<RequireParent><ParentSavings /></RequireParent>} />
              <Route path="/parent/transactions" element={<RequireParent><ParentTransactions /></RequireParent>} />
              <Route path="/parent/achievements" element={<RequireParent><ParentAchievements /></RequireParent>} />
              <Route path="/parent/settings" element={<RequireParent><ParentSettings /></RequireParent>} />
              <Route path="/parent/house-rules" element={<RequireParent><HouseRules /></RequireParent>} />
              <Route path="/child" element={<RequireOnboarded><ChildHome /></RequireOnboarded>} />
              <Route path="/child/courses" element={<RequireOnboarded><ChildCourses /></RequireOnboarded>} />
              <Route path="/child/savings" element={<RequireOnboarded><ChildSavings /></RequireOnboarded>} />
              <Route path="/child/transactions" element={<RequireOnboarded><ChildTransactions /></RequireOnboarded>} />
              <Route path="/child/achievements" element={<RequireOnboarded><ChildAchievements /></RequireOnboarded>} />
              <Route path="/child/house-rules" element={<RequireOnboarded><ChildHouseRules /></RequireOnboarded>} />
              <Route path="/child/vouchers" element={<RequireOnboarded><ChildMyVouchers /></RequireOnboarded>} />
              <Route path="/child/cards" element={<RequireOnboarded><ChildMyCards /></RequireOnboarded>} />
              <Route path="/child/tasks" element={<RequireOnboarded><ChildAllTasks /></RequireOnboarded>} />
            </>
          )}

          {/* work-journal (business mode) */}
          <Route path="/work/journal" element={<RequireParent><WorkJournal /></RequireParent>} />
          <Route path="/work/tasks" element={<RequireOnboarded><WorkTasks /></RequireOnboarded>} />
          <Route path="/work/new" element={<RequireParent><NewTask /></RequireParent>} />
          <Route path="/work/team" element={<RequireParent><WorkTeam /></RequireParent>} />
          {/* Signing out, and reading which version you're on, must be reachable by a
              worker too — otherwise a worker has no way out of the app at all. The
              manager-only parts of the screen are hidden inside it. */}
          <Route path="/work/settings" element={<RequireOnboarded><WorkSettings /></RequireOnboarded>} />
          {/* Suppliers and documents are for whoever is on site, so a worker reads them too. */}
          <Route path="/work/directory" element={<RequireOnboarded><WorkDirectory /></RequireOnboarded>} />
          <Route path="/work/report" element={<RequireParent><WorkReport /></RequireParent>} />
          <Route path="/work/task/:workerId/:taskId" element={<RequireOnboarded><TaskDetail /></RequireOnboarded>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
