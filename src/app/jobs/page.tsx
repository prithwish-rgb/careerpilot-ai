"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Briefcase,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageLoading, ButtonLoading } from "@/components/ui/loading-spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { MODAL_CONTENT_CLASS, PAGE_CONTAINER_CLASS, SECTION_HEADER_CLASS, SECTION_SUBTITLE_CLASS } from "@/lib/modal-styles";

interface Job {
  _id: string;
  title?: string;
  company?: string;
  description?: string;
  keywords?: string[];
  status: string;
  url?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: "saved", label: "Saved", icon: Clock, color: "bg-gray-100 text-gray-800" },
  { value: "applied", label: "Applied", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  { value: "interview", label: "Interview", icon: TrendingUp, color: "bg-yellow-100 text-yellow-800" },
  { value: "offer", label: "Offer", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-800" },
];

export default function JobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    url: "",
    emailText: "",
    status: "saved"
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobs();
    }
  }, [status]);

  const fetchJobs = async () => {
    try {
      setFetchError(null);
      const res = await fetch("/api/jobs");
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await res.json();
      setJobs(data.data ?? []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setFetchError("Unable to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    if (!formData.url && !formData.emailText && (!formData.title || !formData.company)) {
      setFormError("Title and Company are required for manual entry.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: any = { manual: formData };
      if (formData.url) payload.url = formData.url;
      if (formData.emailText) payload.emailText = formData.emailText;

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.error || errorData.message || 'Failed to add job');
      }

      await fetchJobs();
      setIsAddDialogOpen(false);
      setFormData({ title: "", company: "", description: "", url: "", emailText: "", status: "saved" });
    } catch (error) {
      console.error("Failed to add job:", error);
      setFormError(error instanceof Error ? error.message : "Failed to add job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingJob._id,
          updates: {
            title: formData.title,
            company: formData.company,
            description: formData.description,
            status: formData.status,
          },
        }),
      });

      if (res.ok) {
        await fetchJobs();
        setIsEditDialogOpen(false);
        setEditingJob(null);
        setFormData({ title: "", company: "", description: "", url: "", emailText: "", status: "saved" });
      }
    } catch (error) {
      console.error("Failed to update job:", error);
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget._id }),
      });

      if (res.ok) {
        await fetchJobs();
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openViewDialog = (job: Job) => {
    setViewingJob(job);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      description: job.description || "",
      url: job.url || "",
      emailText: "",
      status: job.status,
    });
    setIsEditDialogOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const search = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !search || 
        job.title?.toLowerCase().includes(search) ||
        job.company?.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, debouncedSearchTerm, statusFilter]);

  if (status === "loading" || loading) {
    return <PageLoading text="Loading jobs..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view jobs.</p>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-red-800 text-sm">
                <strong>Unable to load jobs:</strong> {fetchError}
              </p>
              <button onClick={() => { setLoading(true); fetchJobs(); }} className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium">
                Retry
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className={SECTION_HEADER_CLASS}>Job Applications</h1>
            <p className={SECTION_SUBTITLE_CLASS}>Track and manage your job applications</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className={MODAL_CONTENT_CLASS}>
              <DialogHeader>
                <DialogTitle>Add New Job Application</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddJob} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Google"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="url">Job URL (optional)</Label>
                  <div className="relative">
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://company.com/job-posting"
                      className="pr-10 text-sm"
                    />
                    {formData.url && (
                      <button
                        type="button"
                        onClick={() => window.open(formData.url, '_blank')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {formData.url && formData.url.length > 60 && (
                    <p className="text-xs text-gray-500 mt-1 break-all">
                      Preview: {formData.url.substring(0, 60)}...
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emailText">Email Text (optional)</Label>
                  <Textarea
                    id="emailText"
                    value={formData.emailText}
                    onChange={(e) => setFormData({ ...formData, emailText: e.target.value })}
                    placeholder="Paste job alert email content here..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Job description and requirements..."
                    rows={4}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ButtonLoading />}
                    {isSubmitting ? 'Adding...' : 'Add Job'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF] text-sm sm:text-base min-w-[140px]"
          >
            <option value="all">All</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Jobs List */}
        <div className="grid gap-4">
          {fetchError && jobs.length === 0 ? (
            <Card>
              <EmptyState
                icon={XCircle}
                title="Failed to load jobs"
                description={fetchError}
                action={
                  <Button onClick={() => { setLoading(true); fetchJobs(); }}>Try Again</Button>
                }
              />
            </Card>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <EmptyState
                icon={Briefcase}
                title={searchTerm || statusFilter !== "all" ? "No jobs found" : "No saved jobs yet"}
                description={
                  searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You can continue creating a job application below."
                }
                helper={
                  !searchTerm && statusFilter === "all"
                    ? "Tip: Saved jobs will appear here for quick selection."
                    : undefined
                }
                action={
                  !searchTerm && statusFilter === "all" ? (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Job
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const statusOption = statusOptions.find(s => s.value === job.status);
              const StatusIcon = statusOption?.icon || Clock;
              
              return (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {job.title || "Untitled Position"}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 self-start ${statusOption?.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusOption?.label}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{job.company || "Unknown Company"}</p>
                        {job.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {job.description.substring(0, 200)}...
                          </p>
                        )}
                        {job.keywords && job.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {job.keywords.slice(0, 5).map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                            {job.keywords.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                +{job.keywords.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Added {new Date(job.createdAt).toLocaleDateString()}</span>
                            {job.source === "url" && <span>• From URL</span>}
                            {job.source === "email" && <span>• From Email</span>}
                            {job.source === "manual" && <span>• Manual Entry</span>}
                          </div>
                          {job.url && (
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <LinkIcon className="h-3 w-3 flex-shrink-0" />
                              <span 
                                className="truncate hover:text-clip cursor-pointer max-w-xs" 
                                title={job.url}
                                onClick={() => window.open(job.url, '_blank')}
                              >
                                {job.url.length > 50 ? `${job.url.substring(0, 47)}...` : job.url}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 lg:ml-4 flex-shrink-0">
                        <Tooltip label="View job details">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(job)} aria-label="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip label="Edit application">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(job)} aria-label="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        {job.url && (
                          <Tooltip label="Open original job posting">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(job.url, "_blank")}
                              aria-label="Open posting"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip label="Delete application">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(job)}
                            className="text-red-600 hover:text-red-700"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className={MODAL_CONTENT_CLASS}>
            <DialogHeader>
              <DialogTitle>{viewingJob?.title || "Job Details"}</DialogTitle>
            </DialogHeader>
            {viewingJob && (
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</p>
                    <p className="text-gray-900 font-medium mt-1">{viewingJob.company || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                    <p className="text-gray-900 font-medium mt-1 capitalize">{viewingJob.status}</p>
                  </div>
                </div>
                {viewingJob.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-3 rounded-lg border border-gray-100">
                      {viewingJob.description}
                    </p>
                  </div>
                )}
                {viewingJob.url && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open(viewingJob.url, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Original Posting
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete this job application?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDeleteJob}
          loading={isDeleting}
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={MODAL_CONTENT_CLASS}>
            <DialogHeader>
              <DialogTitle>Edit Job Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Job Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company">Company</Label>
                  <Input
                    id="edit-company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Job Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Job</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
