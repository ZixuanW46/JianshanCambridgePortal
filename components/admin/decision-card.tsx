"use client"

import { useState } from "react";
import { dbService } from "@/lib/db-service";
import { Loader2, CheckCircle, XCircle, Clock, Send, Info, RotateCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DecisionCardProps {
    applicationId: string;
    currentInternalDecision: 'accepted' | 'rejected' | 'waitlisted' | null | undefined;
    currentPublicStatus: string;
    onUpdate: () => void;
}

type DecisionType = 'accepted' | 'rejected' | 'waitlisted';

export function DecisionCard({ applicationId, currentInternalDecision, currentPublicStatus, onUpdate }: DecisionCardProps) {
    const [loading, setLoading] = useState(false);
    const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

    const handleSaveDecision = async (decision: string | null) => {
        setLoading(true);
        try {
            await dbService.setInternalDecision(applicationId, decision as any);
            onUpdate();
        } catch (e) {
            console.error("Failed to save decision", e);
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseResult = async () => {
        setLoading(true);
        try {
            await dbService.releaseResult(applicationId);
            setShowReleaseConfirm(false);
            onUpdate();
        } catch (e) {
            console.error("Failed to release result", e);
        } finally {
            setLoading(false);
        }
    };

    const isReleased = ['accepted', 'rejected', 'waitlisted', 'enrolled'].includes(currentPublicStatus) && currentPublicStatus !== 'under_review';

    const decisionButtons = [
        {
            type: 'accepted' as DecisionType,
            label: 'Accept',
            icon: CheckCircle,
            activeColor: 'bg-green-500 text-white border-green-500',
            inactiveColor: 'bg-white text-slate-700 border-slate-200 hover:border-green-500 hover:bg-green-50'
        },
        {
            type: 'rejected' as DecisionType,
            label: 'Reject',
            icon: XCircle,
            activeColor: 'bg-red-500 text-white border-red-500',
            inactiveColor: 'bg-white text-slate-700 border-slate-200 hover:border-red-500 hover:bg-red-50'
        },
        {
            type: 'waitlisted' as DecisionType,
            label: 'Waitlist',
            icon: Clock,
            activeColor: 'bg-amber-500 text-white border-amber-500',
            inactiveColor: 'bg-white text-slate-700 border-slate-200 hover:border-amber-500 hover:bg-amber-50'
        }
    ];

    const getDecisionBadgeColor = () => {
        switch (currentInternalDecision) {
            case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'waitlisted': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="mb-6">
                <h2 className="text-slate-900 font-bold text-lg mb-1">Decision Management</h2>
                <p className="text-slate-600 text-sm">
                    Mark decision internally, then release to applicant.
                </p>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-slate-700 font-medium text-sm">Internal Decision Marking</h3>
                    <div className="group relative">
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg">
                            Select a decision. It won&apos;t be visible to the applicant until released.
                            <div className="absolute -bottom-1 left-1 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {decisionButtons.map((button) => {
                        const Icon = button.icon;
                        const isActive = currentInternalDecision === button.type;
                        return (
                            <button
                                key={button.type}
                                onClick={() => !isReleased && handleSaveDecision(button.type)}
                                disabled={loading || isReleased}
                                className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 transition-all duration-200 ${isActive ? button.activeColor : button.inactiveColor
                                    } ${isActive ? 'shadow-md scale-105' : 'hover:shadow-sm'} ${isReleased ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{button.label}</span>
                            </button>
                        );
                    })}
                </div>

                {currentInternalDecision && (
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-xs font-medium uppercase tracking-wide">Current Mark:</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDecisionBadgeColor()}`}>
                                {currentInternalDecision.toUpperCase()}
                            </span>
                        </div>
                        <button
                            onClick={() => !isReleased && handleSaveDecision(null)}
                            disabled={loading || isReleased}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reset decision"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 my-6"></div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-slate-700 font-medium text-sm">Release Action</h3>
                    {isReleased && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Released
                        </span>
                    )}
                </div>

                {isReleased ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-slate-500 text-sm">
                            This decision has been released to the applicant.
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowReleaseConfirm(true)}
                            disabled={!currentInternalDecision || loading}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${currentInternalDecision && !loading
                                ? 'bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Release Result to Applicant</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-start gap-2 text-slate-500 text-xs px-1">
                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                            <p>
                                Confirmation email will be sent and applicant will see the result immediately.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <Dialog open={showReleaseConfirm} onOpenChange={setShowReleaseConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Release Decision</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to release the result as <span className="font-bold text-slate-900">&quot;{currentInternalDecision?.toUpperCase()}&quot;</span>?
                            This action is immediate and the applicant will be able to view their decision.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReleaseConfirm(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReleaseResult}
                            disabled={loading}
                            className={
                                currentInternalDecision === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
                                    currentInternalDecision === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-amber-600 hover:bg-amber-700'
                            }
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Confirm & Release
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
