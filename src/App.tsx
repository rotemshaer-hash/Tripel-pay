import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./data/store";

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

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  if (!state.onboarded) return <Navigate to="/onboarding/splash" replace />;
  return <>{children}</>;
}

// A real child login has its own account, but it's still just one linked identity
// within the parent's family record — the parent-only screens (freeze a card, edit
// house rules, assign tasks to a sibling) must never be reachable by typing the URL.
function RequireParent({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  if (!state.onboarded) return <Navigate to="/onboarding/splash" replace />;
  if (state.role === "child") return <Navigate to="/child" replace />;
  return <>{children}</>;
}

export default function App() {
  const { state } = useStore();

  return (
    <div className="app-backdrop">
      <div className="phone-shell">
        <Routes>
          <Route path="/" element={<Navigate to={state.onboarded ? `/${state.viewMode}` : "/onboarding/splash"} replace />} />

          <Route path="/onboarding/splash" element={<Splash />} />
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/details" element={<PersonalDetails />} />
          <Route path="/onboarding/children" element={<ChildrenDetails />} />
          <Route path="/onboarding/success" element={<Success />} />
          <Route path="/login" element={<Login />} />
          <Route path="/child-register" element={<ChildRegister />} />
          <Route path="/parent-register" element={<SecondParentRegister />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
