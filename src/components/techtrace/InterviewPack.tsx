import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, MessageSquare } from "lucide-react";

import SectionHeader from "@/components/industry/SectionHeader";
import { ROLE_OPTIONS, STAGE_OPTIONS, type InterviewQuestion, type RoleKey, type StageKey } from "@/types/analysis";

interface InterviewPackProps {
  interviewQuestions: InterviewQuestion[];
  initialRole: RoleKey;
  initialStage: StageKey;
}

const InterviewPack = ({
  interviewQuestions,
  initialRole,
  initialStage,
}: InterviewPackProps) => {
  const [copied, setCopied] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleKey>(initialRole);
  const [selectedStage, setSelectedStage] = useState<StageKey>(initialStage);

  useEffect(() => {
    setSelectedRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    setSelectedStage(initialStage);
  }, [initialStage]);

  const filteredQuestions = interviewQuestions.filter(
    (question) => question.targetRole === selectedRole && question.stage === selectedStage,
  );
  const categories = [...new Set(filteredQuestions.map((question) => question.category))];
  const selectedRoleLabel = ROLE_OPTIONS.find((role) => role.key === selectedRole)?.label;
  const selectedStageLabel = STAGE_OPTIONS.find((stage) => stage.key === selectedStage)?.label;

  const handleCopyAll = async () => {
    const text = filteredQuestions
      .map((question, index) => `${index + 1}. ${question.question}\n   验证逻辑: ${question.verificationLogic}`)
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section>
      <SectionHeader number="5" title="技术访谈问题" subtitle={`围绕技术真实性、产品阶段与壁垒验证生成 · ${selectedRoleLabel} × ${selectedStageLabel}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">访谈对象角色</label>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.key}
                onClick={() => setSelectedRole(role.key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  selectedRole === role.key ? "bg-foreground text-background" : "bg-accent/50 text-muted-foreground hover:bg-accent"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">尽调阶段</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGE_OPTIONS.map((stage) => (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage.key)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  selectedStage === stage.key ? "bg-foreground text-background" : "bg-accent/50 text-muted-foreground hover:bg-accent"
                }`}
              >
                {stage.label}
                <span className="text-[9px] ml-1 opacity-70">({stage.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-foreground">问题包</p>
          <p className="text-[10px] text-muted-foreground mt-1">只保留服务技术尽调的验证问题，不扩展到背景调查或泛情报模块</p>
        </div>
        {filteredQuestions.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:bg-accent/50 px-3 py-1.5 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已复制" : "复制全部"}
          </button>
        )}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="card-base p-8 text-center">
          <MessageSquare className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">当前角色与阶段组合暂无问题</p>
          <p className="text-[10px] text-muted-foreground mt-1">尝试切换访谈对象角色或尽调阶段</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const questions = filteredQuestions.filter((question) => question.category === category);
            return (
              <div key={category} className="card-base p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{questions[0].categoryLabel}</h4>
                <div className="space-y-1">
                  {questions.map((question) => {
                    const isExpanded = expandedQuestion === question.id;
                    return (
                      <div key={question.id}>
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                          className="w-full flex items-start gap-3 py-2 px-2 rounded hover:bg-accent/30 transition-colors text-left"
                        >
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 w-4 text-right flex-shrink-0">
                            {filteredQuestions.indexOf(question) + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-relaxed">{question.question}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${question.difficulty === "deep" ? "bg-foreground text-background" : "bg-accent text-muted-foreground"}`}>
                                {question.difficulty === "deep" ? "深度" : "基础"}
                              </span>
                              {question.relatedPatents.length > 0 && (
                                <span className="text-[9px] text-muted-foreground">相关: {question.relatedPatents.join(", ")}</span>
                              )}
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />}
                        </button>
                        {isExpanded && (
                          <div className="ml-7 mb-2 p-3 bg-accent/30 rounded-md">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1">验证逻辑</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{question.verificationLogic}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default InterviewPack;
