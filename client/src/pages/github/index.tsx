
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Github, 
  Star, 
  GitBranch, 
  Clock, 
  Users, 
  ExternalLink,
  RefreshCw,
  Search,
  Book,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { Textarea } from '../../components/ui/textarea';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stars_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  private: boolean;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

const GitHubIntegrationPage: React.FC = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (token) {
        setAccessToken(token);
        await fetchUserData(token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('github_access_token');
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
      await fetchRepositories(token);
    } catch (error) {
      console.error('User data fetch failed:', error);
      throw error;
    }
  };

  const fetchRepositories = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Repositories fetch failed:', error);
      toast({
        title: "Error",
        description: "Failed to fetch repositories.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssues = async (repo: GitHubRepo) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/issues`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }

      const issuesData = await response.json();
      setIssues(issuesData);
    } catch (error) {
      console.error('Issues fetch failed:', error);
      toast({
        title: "Error",
        description: "Failed to fetch issues.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithGitHub = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "Missing Token",
        description: "Please enter your GitHub personal access token.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await fetchUserData(accessToken);
      localStorage.setItem('github_access_token', accessToken);
      setIsAuthenticated(true);
      
      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${user?.name || user?.login}!`,
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: "Please check your access token and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('github_access_token');
    setIsAuthenticated(false);
    setUser(null);
    setRepositories([]);
    setSelectedRepo(null);
    setIssues([]);
    setAccessToken('');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const selectRepository = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    fetchIssues(repo);
  };

  const createIssue = async (title: string, body: string) => {
    if (!selectedRepo) return;

    try {
      setIsLoading(true);
      const response = await fetch(`https://api.github.com/repos/${selectedRepo.full_name}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, body })
      });

      if (!response.ok) {
        throw new Error('Failed to create issue');
      }

      const newIssue = await response.json();
      setIssues(prev => [newIssue, ...prev]);
      
      toast({
        title: "Issue Created",
        description: `Issue "${title}" has been created successfully.`,
      });
    } catch (error) {
      console.error('Issue creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to create issue.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Github className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl">GitHub Integration</CardTitle>
            <p className="text-gray-600">Connect your GitHub account to access repositories and manage issues</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="access-token">Personal Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Generate a token at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub Settings → Developer settings → Personal access tokens
                  </a>
                </p>
              </div>
              
              <Button 
                onClick={authenticateWithGitHub} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Github className="w-4 h-4 mr-2" />
                )}
                Connect to GitHub
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Required Permissions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• repo (to access private repositories)</li>
                <li>• issues (to create and manage issues)</li>
                <li>• user (to read user profile information)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Github className="w-8 h-8" />
            <h1 className="text-3xl font-bold">GitHub Integration</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <img 
                src={user.avatar_url} 
                alt={user.login}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{user.name || user.login}</span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="repositories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Repositories</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search repositories..."
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fetchRepositories(accessToken)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading repositories...</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredRepositories.map((repo) => (
                    <div 
                      key={repo.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectRepository(repo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-blue-600">{repo.name}</h3>
                            {repo.private ? (
                              <Lock className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Unlock className="w-4 h-4 text-gray-500" />
                            )}
                            <Badge variant="outline">{repo.language || 'Unknown'}</Badge>
                          </div>
                          {repo.description && (
                            <p className="text-gray-600 text-sm mb-2">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {repo.stars_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-4 h-4" />
                              {repo.forks_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(repo.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(repo.html_url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredRepositories.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No repositories match your search.' : 'No repositories found.'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          {selectedRepo ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Issues - {selectedRepo.name}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedRepo.full_name}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fetchIssues(selectedRepo)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{issue.title}</h4>
                            <Badge variant={issue.state === 'open' ? 'default' : 'secondary'}>
                              #{issue.number} • {issue.state}
                            </Badge>
                          </div>
                          {issue.body && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{issue.body}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <img 
                                src={issue.user.avatar_url} 
                                alt={issue.user.login}
                                className="w-4 h-4 rounded-full"
                              />
                              {issue.user.login}
                            </span>
                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(issue.html_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {issues.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-gray-500">
                      No issues found for this repository.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Book className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Select a Repository</h3>
                <p className="text-gray-600">
                  Choose a repository from the Repositories tab to view and manage its issues.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>GitHub Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <img 
                    src={user.avatar_url} 
                    alt={user.login}
                    className="w-24 h-24 rounded-full"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{user.name || user.login}</h2>
                      <p className="text-gray-600">@{user.login}</p>
                      {user.bio && <p className="mt-2">{user.bio}</p>}
                    </div>
                    
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{user.public_repos}</div>
                        <div className="text-gray-600">Repositories</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{user.followers}</div>
                        <div className="text-gray-600">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{user.following}</div>
                        <div className="text-gray-600">Following</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => window.open(user.html_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GitHubIntegrationPage;
