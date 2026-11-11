import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const BranchContext = createContext(null);
const SAVED_BRANCH_KEY = '3k_selected_branch';
const isBranchActive = branch => branch?.is_active === true || Number(branch?.is_active) === 1;

export function BranchProvider({ children }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const selectionWasChanged = useRef(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/branches`)
      .then(response => response.ok ? response.json() : [])
      .then(data => {
        if (!active) return;
        const branchList = Array.isArray(data) ? data.filter(isBranchActive) : [];
        setBranches(branchList);
        if (selectionWasChanged.current) return;
        const savedName = localStorage.getItem(SAVED_BRANCH_KEY)
          || localStorage.getItem('cashier_active_branch')
          || localStorage.getItem('kiosk_active_branch');
        const selected = branchList.find(branch => branch.name === savedName)
          || branchList.find(branch => /gma.*terminal|terminal.*gma/i.test(branch.name))
          || branchList[0]
          || null;
        if (selected) {
          setSelectedBranch(selected);
          localStorage.setItem(SAVED_BRANCH_KEY, selected.name);
        } else {
          setSelectedBranch(null);
          localStorage.removeItem(SAVED_BRANCH_KEY);
        }
      })
      .catch(error => console.error('Failed to load branches for the selected location:', error));
    return () => { active = false; };
  }, [API_URL]);

  const selectBranch = useCallback(branch => {
    selectionWasChanged.current = true;
    if (!branch) {
      setSelectedBranch(null);
      localStorage.removeItem(SAVED_BRANCH_KEY);
      return;
    }
    setSelectedBranch(branch);
    localStorage.setItem(SAVED_BRANCH_KEY, branch.name);
  }, []);

  return <BranchContext.Provider value={{ branches, selectedBranch, selectBranch }}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch must be used inside BranchProvider.');
  return context;
}
