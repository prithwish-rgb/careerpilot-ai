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
import { MODAL_CONTENT_CLASS } from "@/lib/modal-styles";

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
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      const res = await fetch("/api/jobs");
      if (!res.ok) {
        throw new Error(`Failed to fetch jobs: ${res.statusText}`);
      }
      const data = await res.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    if (!formData.url && !formData.emailText && (!formData.title || !formData.company)) {
      setError("Title and Company are required for manual entry.");
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
      setError(error instanceof Error ? error.message : 'Failed to add job');
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

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId }),
      });

      if (res.ok) {
        await fetchJobs();
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-[#6C63FF]/5 via-[#00C9A7]/5 to-[#6C63FF]/5">
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
              <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800" aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
            <p className="text-sm sm:text-base text-gray-600">Track and manage your job applications</p>
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
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {error}
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
          {error && jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <XCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to load jobs
                </h3>
                <p className="text-gray-500 mb-4">
                  {error}
                </p>
                <Button onClick={() => { setLoading(true); fetchJobs(); }}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all" ? "No jobs found" : "No job applications yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "Start by adding your first job application"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Job
                  </Button>
                )}
              </CardContent>
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
                            onClick={() => handleDeleteJob(job._id)}
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
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Company</p>
                  <p className="text-gray-900">{viewingJob.company || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Status</p>
                  <p className="text-gray-900 capitalize">{viewingJob.status}</p>
                </div>
                {viewingJob.description && (
                  <div>
                    <p className="font-medium text-gray-500">Description</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingJob.description}</p>
                  </div>
                )}
                {viewingJob.url && (
                  <Button variant="outline" onClick={() => window.open(viewingJob.url, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Original Posting
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
