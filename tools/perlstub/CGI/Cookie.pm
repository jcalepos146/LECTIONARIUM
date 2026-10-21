package CGI::Cookie;
use strict; use warnings;
sub new { my $c=shift; return bless {@_}, $c; }
sub fetch { return (); }
sub value { return ''; }
sub name { return ''; }
sub AUTOLOAD { return ''; }
sub DESTROY {}
1;
