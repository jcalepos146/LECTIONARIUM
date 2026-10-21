package CGI::Carp;
use strict; use warnings;
sub import { my $caller=caller; no strict 'refs'; *{"${caller}::fatalsToBrowser"}=sub{}; }
1;
